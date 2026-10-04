import SwiftUI

struct ContentView: View {
    @ObservedObject var state: ExtensionState

    /// The context-menu item's own wording, so step 3 names it exactly.
    private let menuItem = NSLocalizedString("Add to Flashcards.gg", comment: "The extension's context-menu item")
    private let keysURL = URL(string: "https://flashcards.gg/account/api-keys")!

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 16) {
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .frame(width: 72, height: 72)
                VStack(alignment: .leading, spacing: 4) {
                    Text(verbatim: "Flashcards.gg for Safari")
                        .font(.title2.weight(.semibold))
                    Text("Add a card from selected text to your Flashcards.gg sets.")
                        .foregroundColor(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                if let on = state.isEnabled {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(on ? Color.green : Color.orange)
                            .frame(width: 9, height: 9)
                        on ? Text("The extension is on in Safari.") : Text("The extension is off in Safari.")
                    }
                }
                Button("Open Safari Settings") { state.openSafariSettings() }
                    .keyboardShortcut(.defaultAction)
                    .controlSize(.large)
            }

            Divider()

            VStack(alignment: .leading, spacing: 12) {
                step(1, Text("Turn on Flashcards.gg in Safari Settings › Extensions."))
                step(2, Text("Click the Flashcards.gg button in the Safari toolbar and paste your API key from flashcards.gg (Account › API keys)."))
                step(3, Text("Select text on a page, Control-click it and choose “\(menuItem)”."))
            }

            Link("Create a key", destination: keysURL)
                .padding(.leading, 30)
        }
        .padding(28)
        .frame(width: 500)
        .onAppear { state.refresh() }
    }

    private func step(_ n: Int, _ text: Text) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(verbatim: "\(n)")
                .font(.callout.weight(.semibold))
                .foregroundColor(.white)
                .frame(width: 20, height: 20)
                .background(Circle().fill(Color("AccentColor")))
            text.fixedSize(horizontal: false, vertical: true)
        }
    }
}
