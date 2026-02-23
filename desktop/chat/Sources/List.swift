import ConvexCore
import DesktopShared
import Foundation
import SwiftCrossUI

internal final class ListViewModel: SwiftCrossUI.ObservableObject, Performing {
    @SwiftCrossUI.Published var chats = [Chat]()
    @SwiftCrossUI.Published var isLoading = false
    @SwiftCrossUI.Published var errorMessage: String?

    @MainActor
    func load() async {
        await performLoading({ isLoading = $0 }) {
            let result = try await ChatAPI.list(
                client,
                where: ChatWhere(own: true)
            )
            chats = result.page
        }
    }

    @MainActor
    func createChat() async {
        await perform {
            try await ChatAPI.create(client, isPublic: false, title: "New Chat")
            await self.load()
        }
    }

    @MainActor
    func deleteChat(id: String) async {
        await perform {
            try await ChatAPI.rm(client, id: id)
            await self.load()
        }
    }
}

internal struct ListView: View {
    @State private var viewModel = ListViewModel()
    var path: Binding<NavigationPath>

    var body: some View {
        VStack {
            HStack {
                Text("Chats")
                Button("New Chat") {
                    Task { await viewModel.createChat() }
                }
            }
            .padding(.bottom, 4)

            if viewModel.isLoading {
                Text("Loading...")
            } else if let msg = viewModel.errorMessage {
                Text(msg)
                    .foregroundColor(.red)
            } else if viewModel.chats.isEmpty {
                Text("No chats yet")
            } else {
                ScrollView {
                    ForEach(viewModel.chats) { chat in
                        HStack {
                            VStack {
                                Text(chat.title.isEmpty ? "Untitled" : chat.title)
                                HStack {
                                    Text(chat.isPublic ? "Public" : "Private")
                                    Text(formatTimestamp(chat.updatedAt))
                                }
                            }
                            Button("Delete") {
                                Task { await viewModel.deleteChat(id: chat._id) }
                            }
                            NavigationLink("Open", value: chat._id, path: path)
                        }
                        .padding(.bottom, 4)
                    }
                }
            }
        }
        .task {
            await viewModel.load()
        }
    }
}
