#!/usr/bin/env python3
"""App Store Connect listing for "Flashcards.gg for Safari" from safari/metadata/.

Dry run by default: prints what would change. `--apply` writes it.

  ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=~/.appstoreconnect/AuthKey_….p8 \
    python3 safari/scripts/asc_metadata.py [--apply] [--screenshots]

- name, subtitle, privacy URL  → appInfoLocalizations (the app's current appInfo)
- description, keywords, promotional text, support and marketing URLs
                                → appStoreVersionLocalizations (the editable macOS version)
- --screenshots: docs/store/safari/mac_*.png → the en-US version localization
  (APP_DESKTOP); other languages fall back to the primary language's screenshots.

Needs pyjwt + cryptography. Never prints the key.
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request

import jwt

BUNDLE_ID = 'gg.flashcards.safari'
HERE = os.path.dirname(os.path.abspath(__file__))
META = os.path.join(os.path.dirname(HERE), 'metadata')
SHOTS = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'docs', 'store', 'safari')

INFO_FIELDS = {'name': 'name', 'subtitle': 'subtitle', 'privacy_url': 'privacyPolicyUrl'}
VERSION_FIELDS = {'description': 'description', 'keywords': 'keywords', 'promotional_text': 'promotionalText',
                  'support_url': 'supportUrl', 'marketing_url': 'marketingUrl'}


def token():
    key = open(os.path.expanduser(os.environ['ASC_KEY_PATH'])).read()
    return jwt.encode({'iss': os.environ['ASC_ISSUER_ID'], 'exp': int(time.time()) + 600, 'aud': 'appstoreconnect-v1'},
                      key, algorithm='ES256', headers={'kid': os.environ['ASC_KEY_ID'], 'typ': 'JWT'})


def call(method, path, body=None):
    url = path if path.startswith('https://') else 'https://api.appstoreconnect.apple.com' + path
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f'{method} {path} → {e.code}: {e.read().decode()[:600]}')


def read_locale(loc):
    d = os.path.join(META, loc)
    return {f[:-4]: open(os.path.join(d, f), encoding='utf-8').read().strip() for f in os.listdir(d) if f.endswith('.txt')}


def sync(kind, parent_rel, parent_id, existing, fields, apply):
    """Create or patch one localization per metadata folder."""
    by_locale = {x['attributes']['locale']: x for x in existing}
    for loc in sorted(os.listdir(META)):
        want = {api: v for f, api in fields.items() if (v := read_locale(loc).get(f))}
        cur = by_locale.get(loc)
        if cur is None:
            print(f'  {kind} {loc}: create ({", ".join(want)})')
            if apply:
                call('POST', f'/v1/{kind}', {'data': {'type': kind, 'attributes': {'locale': loc, **want},
                     'relationships': {parent_rel: {'data': {'type': parent_rel + 's', 'id': parent_id}}}}})
            continue
        diff = {k: v for k, v in want.items() if (cur['attributes'].get(k) or '') != v}
        if diff:
            print(f'  {kind} {loc}: update {", ".join(diff)}')
            if apply:
                call('PATCH', f'/v1/{kind}/{cur["id"]}', {'data': {'type': kind, 'id': cur['id'], 'attributes': diff}})


def upload_screenshots(version_loc_id, apply):
    files = sorted(f for f in os.listdir(SHOTS) if f.startswith('mac_') and f.endswith('.png'))
    sets = call('GET', f'/v1/appStoreVersionLocalizations/{version_loc_id}/appScreenshotSets')['data']
    desktop = next((s for s in sets if s['attributes']['screenshotDisplayType'] == 'APP_DESKTOP'), None)
    have = []
    if desktop:
        have = [s['attributes']['fileName'] for s in call('GET', f'/v1/appScreenshotSets/{desktop["id"]}/appScreenshots')['data']]
    todo = [f for f in files if f not in have]
    print(f'  screenshots en-US APP_DESKTOP: have {len(have)}, upload {todo or "nothing"}')
    if not apply or not todo:
        return
    if desktop is None:
        desktop = call('POST', '/v1/appScreenshotSets', {'data': {'type': 'appScreenshotSets',
                       'attributes': {'screenshotDisplayType': 'APP_DESKTOP'},
                       'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': version_loc_id}}}}})['data']
    for f in todo:
        blob = open(os.path.join(SHOTS, f), 'rb').read()
        shot = call('POST', '/v1/appScreenshots', {'data': {'type': 'appScreenshots', 'attributes': {'fileName': f, 'fileSize': len(blob)},
                    'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': desktop['id']}}}}})['data']
        for op in shot['attributes']['uploadOperations']:
            part = blob[op['offset']:op['offset'] + op['length']]
            req = urllib.request.Request(op['url'], method=op['method'], data=part,
                                         headers={h['name']: h['value'] for h in op['requestHeaders']})
            urllib.request.urlopen(req).read()
        call('PATCH', f'/v1/appScreenshots/{shot["id"]}', {'data': {'type': 'appScreenshots', 'id': shot['id'],
             'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(blob).hexdigest()}}})
        print(f'    uploaded {f}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--screenshots', action='store_true')
    a = ap.parse_args()

    app = call('GET', f'/v1/apps?filter[bundleId]={BUNDLE_ID}')['data'][0]
    infos = call('GET', f'/v1/apps/{app["id"]}/appInfos')['data']
    info = next(i for i in infos if i['attributes']['state'] not in ('READY_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_INFO'))
    versions = call('GET', f'/v1/apps/{app["id"]}/appStoreVersions?filter[platform]=MAC_OS')['data']
    version = next(v for v in versions if v['attributes']['appStoreState'] in
                   ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'))
    print(f'{app["attributes"]["name"]} ({app["id"]}), version {version["attributes"]["versionString"]}'
          f' {version["attributes"]["appStoreState"]}{"" if a.apply else " — dry run"}')

    sync('appInfoLocalizations', 'appInfo', info['id'],
         call('GET', f'/v1/appInfos/{info["id"]}/appInfoLocalizations?limit=50')['data'], INFO_FIELDS, a.apply)
    vlocs = call('GET', f'/v1/appStoreVersions/{version["id"]}/appStoreVersionLocalizations?limit=50')['data']
    sync('appStoreVersionLocalizations', 'appStoreVersion', version['id'], vlocs, VERSION_FIELDS, a.apply)

    if a.screenshots:
        vlocs = call('GET', f'/v1/appStoreVersions/{version["id"]}/appStoreVersionLocalizations?limit=50')['data']
        en = next((v for v in vlocs if v['attributes']['locale'] == 'en-US'), None)
        if en:
            upload_screenshots(en['id'], a.apply)


if __name__ == '__main__':
    main()
