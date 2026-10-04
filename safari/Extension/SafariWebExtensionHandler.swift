// Native side of the Safari web extension. Safari requires a principal class,
// but the extension sends no native messages (no runtime.sendNativeMessage),
// so every request is answered empty.
import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        context.completeRequest(returningItems: [], completionHandler: nil)
    }
}
