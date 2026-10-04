// Container app for the Safari extension: one window that says whether the
// extension is on, opens Safari's settings, and explains the three steps.
// No storyboard; the menu and the window are built here.
import Cocoa
import SwiftUI

@main
@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let state = ExtensionState()
    private var window: NSWindow?

    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.run()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.mainMenu = makeMenu()

        let hosting = NSHostingController(rootView: ContentView(state: state))
        let window = NSWindow(contentViewController: hosting)
        window.title = appName
        window.styleMask = [.titled, .closable, .miniaturizable]
        window.setContentSize(hosting.view.fittingSize)
        window.center()
        window.makeKeyAndOrderFront(nil)
        self.window = window
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        // Back from Safari's settings: show the new state.
        state.refresh()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private var appName: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? "Flashcards.gg for Safari"
    }

    private func makeMenu() -> NSMenu {
        let main = NSMenu()

        let appMenu = NSMenu()
        appMenu.addItem(withTitle: String(format: NSLocalizedString("About %@", comment: "App menu"), appName),
                        action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: String(format: NSLocalizedString("Hide %@", comment: "App menu"), appName),
                        action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let others = appMenu.addItem(withTitle: NSLocalizedString("Hide Others", comment: "App menu"),
                                     action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        others.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(withTitle: NSLocalizedString("Show All", comment: "App menu"),
                        action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: String(format: NSLocalizedString("Quit %@", comment: "App menu"), appName),
                        action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        main.addItem(withTitle: appName, action: nil, keyEquivalent: "").submenu = appMenu

        let windowTitle = NSLocalizedString("Window", comment: "Menu")
        let windowMenu = NSMenu(title: windowTitle)
        windowMenu.addItem(withTitle: NSLocalizedString("Minimize", comment: "Window menu"),
                           action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: NSLocalizedString("Close", comment: "Window menu"),
                           action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        main.addItem(withTitle: windowTitle, action: nil, keyEquivalent: "").submenu = windowMenu
        NSApp.windowsMenu = windowMenu

        return main
    }
}
