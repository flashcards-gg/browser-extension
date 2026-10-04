import Combine
import Foundation
import SafariServices

/// Whether Safari has the extension turned on; nil until Safari answers (or
/// when it cannot say).
final class ExtensionState: ObservableObject {
    static let extensionIdentifier = "gg.flashcards.safari.extension"

    @Published private(set) var isEnabled: Bool?

    func refresh() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: Self.extensionIdentifier) { state, _ in
            DispatchQueue.main.async { self.isEnabled = state?.isEnabled }
        }
    }

    func openSafariSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: Self.extensionIdentifier) { _ in }
    }
}
