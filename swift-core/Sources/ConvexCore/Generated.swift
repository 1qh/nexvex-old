// swiftlint:disable file_types_order file_length
import Foundation

public struct MovieGenre: Codable, Sendable {
    public let id: Double
    public let name: String
}

public struct MessagePart: Codable, Sendable {
    public let type: MessagePartType
    public let text: String?
    public let image: String?
    public let file: String?
    public let name: String?
}

public enum BlogCategory: String, Codable, Sendable {
    case life
    case tech
    case tutorial
}

public enum ProjectStatus: String, Codable, Sendable {
    case active
    case archived
    case completed
}

public enum TaskPriority: String, Codable, Sendable {
    case high
    case low
    case medium
}

public enum WikiStatus: String, Codable, Sendable {
    case draft
    case published
}

public enum BlogProfileTheme: String, Codable, Sendable {
    case dark
    case light
    case system
}

public enum OrgProfileTheme: String, Codable, Sendable {
    case dark
    case light
    case system
}

public enum MessagePartType: String, Codable, Sendable {
    case file
    case image
    case text
}

public enum MessageRole: String, Codable, Sendable {
    case assistant
    case system
    case user
}

public struct Blog: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let author: Author?
    public let updatedAt: Double
    public let userId: String
    public let attachments: [String]?
    public let category: BlogCategory
    public let content: String
    public let coverImage: String?
    public let published: Bool
    public let tags: [String]?
    public let title: String
    public let attachmentsUrls: [String]?
    public let coverImageUrl: String?

    public var id: String {
        _id
    }
}

public struct Chat: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let author: Author?
    public let updatedAt: Double
    public let userId: String
    public let isPublic: Bool
    public let title: String

    public var id: String {
        _id
    }
}

public struct Project: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let orgId: String
    public let updatedAt: Double
    public let userId: String
    public let description: String?
    public let editors: [String]?
    public let name: String
    public let status: ProjectStatus?
    public let editorsUrls: [String]?

    public var id: String {
        _id
    }
}

public struct TaskItem: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let orgId: String
    public let updatedAt: Double
    public let userId: String
    public let assigneeId: String?
    public let completed: Bool?
    public let priority: TaskPriority?
    public let projectId: String
    public let title: String
    public let assigneeIdUrl: String?
    public let projectIdUrl: String?

    public var id: String {
        _id
    }
}

public struct Wiki: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let orgId: String
    public let updatedAt: Double
    public let userId: String
    public let content: String?
    public let deletedAt: Double?
    public let editors: [String]?
    public let slug: String
    public let status: WikiStatus
    public let title: String
    public let editorsUrls: [String]?

    public var id: String {
        _id
    }
}

public struct Movie: Codable, Identifiable, Sendable {
    public let _creationTime: Double?
    public let _id: String?
    public let cacheHit: Bool?
    public let backdrop_path: String?
    public let budget: Double?
    public let genres: [MovieGenre]
    public let original_title: String
    public let overview: String
    public let poster_path: String?
    public let release_date: String
    public let revenue: Double?
    public let runtime: Double?
    public let tagline: String?
    public let title: String
    public let tmdb_id: Double
    public let vote_average: Double
    public let vote_count: Double

    public var id: String {
        _id ?? ""
    }
}

public struct BlogProfile: Codable, Identifiable, Sendable {
    public let _id: String?
    public let avatar: String?
    public let bio: String?
    public let displayName: String
    public let notifications: Bool
    public let theme: BlogProfileTheme
    public let avatarUrl: String?

    public var id: String {
        _id ?? ""
    }
}

public struct OrgProfile: Codable, Identifiable, Sendable {
    public let _id: String?
    public let avatar: String?
    public let bio: String?
    public let displayName: String
    public let notifications: Bool
    public let theme: OrgProfileTheme
    public let avatarUrl: String?

    public var id: String {
        _id ?? ""
    }
}

public struct Message: Codable, Identifiable, Sendable {
    public let _creationTime: Double
    public let _id: String
    public let updatedAt: Double?
    public let userId: String?
    public let chatId: String
    public let parts: [MessagePart]
    public let role: MessageRole
    public let chatIdUrl: String?

    public var id: String {
        _id
    }
}

public struct Author: Codable, Sendable {
    public let name: String?
    public let email: String?
    public let imageUrl: String?
}

#if !SKIP
public struct PaginatedResult<T: Codable & Sendable>: Codable, Sendable {
    public let page: [T]
    public let continueCursor: String
    public let isDone: Bool

    public init(page: [T], continueCursor: String, isDone: Bool) {
        self.page = page
        self.continueCursor = continueCursor
        self.isDone = isDone
    }
}
#else
public struct PaginatedResult<T: Codable & Sendable>: Sendable {
    public let page: [T]
    public let continueCursor: String
    public let isDone: Bool

    public init(page: [T], continueCursor: String, isDone: Bool) {
        self.page = page
        self.continueCursor = continueCursor
        self.isDone = isDone
    }
}
#endif

public struct Org: Codable, Identifiable, Sendable {
    public let _id: String
    public let _creationTime: Double
    public let name: String
    public let slug: String
    public let userId: String
    public let updatedAt: Double

    public var id: String {
        _id
    }
}

public struct OrgMember: Codable, Identifiable, Sendable {
    public let _id: String
    public let orgId: String
    public let userId: String
    public let isAdmin: Bool
    public let updatedAt: Double

    public var id: String {
        _id
    }
}

public struct OrgMemberEntry: Codable, Identifiable, Sendable {
    public let userId: String
    public let role: String
    public let name: String?
    public let email: String?
    public let imageUrl: String?

    public var id: String {
        userId
    }
}

public struct OrgWithRole: Codable, Identifiable, Sendable {
    public let org: Org
    public let role: String

    public var id: String {
        org._id
    }
}

public struct OrgMembership: Codable, Sendable {
    public let _id: String?
    public let orgId: String?
    public let userId: String?
    public let isAdmin: Bool?
    public let role: String?
}

public struct OrgInvite: Codable, Identifiable, Sendable {
    public let _id: String
    public let orgId: String
    public let email: String
    public let expiresAt: Double

    public var id: String {
        _id
    }
}

public struct OrgJoinRequest: Codable, Identifiable, Sendable {
    public let _id: String
    public let orgId: String
    public let userId: String
    public let status: String

    public var id: String {
        _id
    }
}

public enum BlogProfileAPI {
    public static let get = "blogProfile:get"
    public static let upsert = "blogProfile:upsert"

    public static func upsert(
        _ client: ConvexClientProtocol,
        avatar: String? = nil,
        bio: String? = nil,
        displayName: String? = nil,
        notifications: Bool? = nil,
        theme: BlogProfileTheme? = nil
    ) async throws {
        var args = [String: Any]()
        if let avatar {
            args["avatar"] = avatar
        }
        if let bio {
            args["bio"] = bio
        }
        if let displayName {
            args["displayName"] = displayName
        }
        if let notifications {
            args["notifications"] = notifications
        }
        if let theme {
            args["theme"] = theme.rawValue
        }
        try await client.mutation("blogProfile:upsert", args: args)
    }

    public static func get(_ client: ConvexClientProtocol) async throws -> BlogProfile? {
        try await client.query("blogProfile:get", args: [:])
    }
}

public enum ProjectAPI {
    public static let addEditor = "project:addEditor"
    public static let bulkRm = "project:bulkRm"
    public static let create = "project:create"
    public static let editors = "project:editors"
    public static let list = "project:list"
    public static let read = "project:read"
    public static let removeEditor = "project:removeEditor"
    public static let rm = "project:rm"
    public static let setEditors = "project:setEditors"
    public static let update = "project:update"

    public static func create(
        _ client: ConvexClientProtocol,
        orgId: String,
        description: String? = nil,
        editors: [String]? = nil,
        name: String,
        status: ProjectStatus? = nil
    ) async throws {
        var args: [String: Any] = ["orgId": orgId, "name": name]
        if let description {
            args["description"] = description
        }
        if let editors {
            args["editors"] = editors
        }
        if let status {
            args["status"] = status.rawValue
        }
        try await client.mutation("project:create", args: args)
    }

    public static func update(
        _ client: ConvexClientProtocol,
        orgId: String,
        id: String,
        description: String? = nil,
        editors: [String]? = nil,
        name: String? = nil,
        status: ProjectStatus? = nil,
        expectedUpdatedAt: Double? = nil
    ) async throws {
        var args: [String: Any] = ["id": id, "orgId": orgId]
        if let description {
            args["description"] = description
        }
        if let editors {
            args["editors"] = editors
        }
        if let name {
            args["name"] = name
        }
        if let status {
            args["status"] = status.rawValue
        }
        if let expectedUpdatedAt {
            args["expectedUpdatedAt"] = expectedUpdatedAt
        }
        try await client.mutation("project:update", args: args)
    }

    public static func rm(_ client: ConvexClientProtocol, orgId: String, id: String) async throws {
        try await client.mutation("project:rm", args: ["id": id, "orgId": orgId])
    }

    public static func read(_ client: ConvexClientProtocol, orgId: String, id: String) async throws -> Project {
        try await client.query("project:read", args: ["id": id, "orgId": orgId])
    }
}

public enum WikiAPI {
    public static let addEditor = "wiki:addEditor"
    public static let bulkRm = "wiki:bulkRm"
    public static let bulkUpdate = "wiki:bulkUpdate"
    public static let create = "wiki:create"
    public static let editors = "wiki:editors"
    public static let list = "wiki:list"
    public static let read = "wiki:read"
    public static let removeEditor = "wiki:removeEditor"
    public static let restore = "wiki:restore"
    public static let rm = "wiki:rm"
    public static let setEditors = "wiki:setEditors"
    public static let update = "wiki:update"

    public static func create(
        _ client: ConvexClientProtocol,
        orgId: String,
        content: String? = nil,
        deletedAt: Double? = nil,
        editors: [String]? = nil,
        slug: String,
        status: WikiStatus,
        title: String
    ) async throws {
        var args: [String: Any] = ["orgId": orgId, "slug": slug, "status": status.rawValue, "title": title]
        if let content {
            args["content"] = content
        }
        if let deletedAt {
            args["deletedAt"] = deletedAt
        }
        if let editors {
            args["editors"] = editors
        }
        try await client.mutation("wiki:create", args: args)
    }

    public static func update(
        _ client: ConvexClientProtocol,
        orgId: String,
        id: String,
        content: String? = nil,
        deletedAt: Double? = nil,
        editors: [String]? = nil,
        slug: String? = nil,
        status: WikiStatus? = nil,
        title: String? = nil,
        expectedUpdatedAt: Double? = nil
    ) async throws {
        var args: [String: Any] = ["id": id, "orgId": orgId]
        if let content {
            args["content"] = content
        }
        if let deletedAt {
            args["deletedAt"] = deletedAt
        }
        if let editors {
            args["editors"] = editors
        }
        if let slug {
            args["slug"] = slug
        }
        if let status {
            args["status"] = status.rawValue
        }
        if let title {
            args["title"] = title
        }
        if let expectedUpdatedAt {
            args["expectedUpdatedAt"] = expectedUpdatedAt
        }
        try await client.mutation("wiki:update", args: args)
    }

    public static func rm(_ client: ConvexClientProtocol, orgId: String, id: String) async throws {
        try await client.mutation("wiki:rm", args: ["id": id, "orgId": orgId])
    }

    public static func read(_ client: ConvexClientProtocol, orgId: String, id: String) async throws -> Wiki {
        try await client.query("wiki:read", args: ["id": id, "orgId": orgId])
    }
}

public enum MobileAiAPI {
    public static let chat = "mobileAi:chat"
}

public enum BlogAPI {
    public static let bulkRm = "blog:bulkRm"
    public static let bulkUpdate = "blog:bulkUpdate"
    public static let create = "blog:create"
    public static let list = "blog:list"
    public static let read = "blog:read"
    public static let search = "blog:search"
    public static let rm = "blog:rm"
    public static let update = "blog:update"

    public static func create(
        _ client: ConvexClientProtocol,
        attachments: [String]? = nil,
        category: BlogCategory,
        content: String,
        coverImage: String? = nil,
        published: Bool,
        tags: [String]? = nil,
        title: String
    ) async throws {
        var args: [String: Any] = ["category": category.rawValue, "content": content, "published": published, "title": title]
        if let attachments {
            args["attachments"] = attachments
        }
        if let coverImage {
            args["coverImage"] = coverImage
        }
        if let tags {
            args["tags"] = tags
        }
        try await client.mutation("blog:create", args: args)
    }

    public static func update(
        _ client: ConvexClientProtocol,
        id: String,
        attachments: [String]? = nil,
        category: BlogCategory? = nil,
        content: String? = nil,
        coverImage: String? = nil,
        published: Bool? = nil,
        tags: [String]? = nil,
        title: String? = nil,
        expectedUpdatedAt: Double? = nil
    ) async throws {
        var args: [String: Any] = ["id": id]
        if let attachments {
            args["attachments"] = attachments
        }
        if let category {
            args["category"] = category.rawValue
        }
        if let content {
            args["content"] = content
        }
        if let coverImage {
            args["coverImage"] = coverImage
        }
        if let published {
            args["published"] = published
        }
        if let tags {
            args["tags"] = tags
        }
        if let title {
            args["title"] = title
        }
        if let expectedUpdatedAt {
            args["expectedUpdatedAt"] = expectedUpdatedAt
        }
        try await client.mutation("blog:update", args: args)
    }

    public static func rm(_ client: ConvexClientProtocol, id: String) async throws {
        try await client.mutation("blog:rm", args: ["id": id])
    }

    public static func read(_ client: ConvexClientProtocol, id: String) async throws -> Blog {
        try await client.query("blog:read", args: ["id": id])
    }
}

public enum MovieAPI {
    public static let search = "movie:search"
    public static let all = "movie:all"
    public static let checkRL = "movie:checkRL"
    public static let create = "movie:create"
    public static let get = "movie:get"
    public static let getInternal = "movie:getInternal"
    public static let invalidate = "movie:invalidate"
    public static let list = "movie:list"
    public static let load = "movie:load"
    public static let purge = "movie:purge"
    public static let read = "movie:read"
    public static let refresh = "movie:refresh"
    public static let rm = "movie:rm"
    public static let set = "movie:set"
    public static let update = "movie:update"
}

public enum FileAPI {
    public static let assembleChunks = "file:assembleChunks"
    public static let cancelChunkedUpload = "file:cancelChunkedUpload"
    public static let CHUNK_SIZE = "file:CHUNK_SIZE"
    public static let confirmChunk = "file:confirmChunk"
    public static let finalizeAssembly = "file:finalizeAssembly"
    public static let getSessionForAssembly = "file:getSessionForAssembly"
    public static let getUploadProgress = "file:getUploadProgress"
    public static let info = "file:info"
    public static let startChunkedUpload = "file:startChunkedUpload"
    public static let upload = "file:upload"
    public static let uploadChunk = "file:uploadChunk"
    public static let validate = "file:validate"
}

public enum ChatAPI {
    public static let list = "chat:list"
    public static let read = "chat:read"
    public static let create = "chat:create"
    public static let pubRead = "chat:pubRead"
    public static let rm = "chat:rm"
    public static let update = "chat:update"

    public static func create(
        _ client: ConvexClientProtocol,
        isPublic: Bool,
        title: String
    ) async throws {
        let args: [String: Any] = ["isPublic": isPublic, "title": title]
        try await client.mutation("chat:create", args: args)
    }

    public static func update(
        _ client: ConvexClientProtocol,
        id: String,
        isPublic: Bool? = nil,
        title: String? = nil,
        expectedUpdatedAt: Double? = nil
    ) async throws {
        var args: [String: Any] = ["id": id]
        if let isPublic {
            args["isPublic"] = isPublic
        }
        if let title {
            args["title"] = title
        }
        if let expectedUpdatedAt {
            args["expectedUpdatedAt"] = expectedUpdatedAt
        }
        try await client.mutation("chat:update", args: args)
    }

    public static func rm(_ client: ConvexClientProtocol, id: String) async throws {
        try await client.mutation("chat:rm", args: ["id": id])
    }

    public static func read(_ client: ConvexClientProtocol, id: String) async throws -> Chat {
        try await client.query("chat:read", args: ["id": id])
    }
}

public enum MessageAPI {
    public static let create = "message:create"
    public static let list = "message:list"
    public static let update = "message:update"
    public static let pubGet = "message:pubGet"
    public static let pubList = "message:pubList"
}

public enum OrgProfileAPI {
    public static let get = "orgProfile:get"
    public static let upsert = "orgProfile:upsert"

    public static func upsert(
        _ client: ConvexClientProtocol,
        avatar: String? = nil,
        bio: String? = nil,
        displayName: String? = nil,
        notifications: Bool? = nil,
        theme: OrgProfileTheme? = nil
    ) async throws {
        var args = [String: Any]()
        if let avatar {
            args["avatar"] = avatar
        }
        if let bio {
            args["bio"] = bio
        }
        if let displayName {
            args["displayName"] = displayName
        }
        if let notifications {
            args["notifications"] = notifications
        }
        if let theme {
            args["theme"] = theme.rawValue
        }
        try await client.mutation("orgProfile:upsert", args: args)
    }

    public static func get(_ client: ConvexClientProtocol) async throws -> OrgProfile? {
        try await client.query("orgProfile:get", args: [:])
    }
}

public enum OrgAPI {
    public static let acceptInvite = "org:acceptInvite"
    public static let approveJoinRequest = "org:approveJoinRequest"
    public static let cancelJoinRequest = "org:cancelJoinRequest"
    public static let create = "org:create"
    public static let get = "org:get"
    public static let getBySlug = "org:getBySlug"
    public static let getPublic = "org:getPublic"
    public static let invite = "org:invite"
    public static let isSlugAvailable = "org:isSlugAvailable"
    public static let leave = "org:leave"
    public static let members = "org:members"
    public static let membership = "org:membership"
    public static let myJoinRequest = "org:myJoinRequest"
    public static let myOrgs = "org:myOrgs"
    public static let pendingInvites = "org:pendingInvites"
    public static let pendingJoinRequests = "org:pendingJoinRequests"
    public static let rejectJoinRequest = "org:rejectJoinRequest"
    public static let remove = "org:remove"
    public static let removeMember = "org:removeMember"
    public static let requestJoin = "org:requestJoin"
    public static let revokeInvite = "org:revokeInvite"
    public static let setAdmin = "org:setAdmin"
    public static let transferOwnership = "org:transferOwnership"
    public static let update = "org:update"
    public static let getOrCreate = "org:getOrCreate"
}

public enum UserAPI {
    public static let me = "user:me"
}

public enum TaskAPI {
    public static let assign = "task:assign"
    public static let bulkRm = "task:bulkRm"
    public static let bulkUpdate = "task:bulkUpdate"
    public static let byProject = "task:byProject"
    public static let create = "task:create"
    public static let list = "task:list"
    public static let read = "task:read"
    public static let rm = "task:rm"
    public static let toggle = "task:toggle"
    public static let update = "task:update"

    public static func create(
        _ client: ConvexClientProtocol,
        orgId: String,
        assigneeId: String? = nil,
        completed: Bool? = nil,
        priority: TaskPriority? = nil,
        projectId: String,
        title: String
    ) async throws {
        var args: [String: Any] = ["orgId": orgId, "projectId": projectId, "title": title]
        if let assigneeId {
            args["assigneeId"] = assigneeId
        }
        if let completed {
            args["completed"] = completed
        }
        if let priority {
            args["priority"] = priority.rawValue
        }
        try await client.mutation("task:create", args: args)
    }

    public static func update(
        _ client: ConvexClientProtocol,
        orgId: String,
        id: String,
        assigneeId: String? = nil,
        completed: Bool? = nil,
        priority: TaskPriority? = nil,
        projectId: String? = nil,
        title: String? = nil,
        expectedUpdatedAt: Double? = nil
    ) async throws {
        var args: [String: Any] = ["id": id, "orgId": orgId]
        if let assigneeId {
            args["assigneeId"] = assigneeId
        }
        if let completed {
            args["completed"] = completed
        }
        if let priority {
            args["priority"] = priority.rawValue
        }
        if let projectId {
            args["projectId"] = projectId
        }
        if let title {
            args["title"] = title
        }
        if let expectedUpdatedAt {
            args["expectedUpdatedAt"] = expectedUpdatedAt
        }
        try await client.mutation("task:update", args: args)
    }

    public static func rm(_ client: ConvexClientProtocol, orgId: String, id: String) async throws {
        try await client.mutation("task:rm", args: ["id": id, "orgId": orgId])
    }

    public static func read(_ client: ConvexClientProtocol, orgId: String, id: String) async throws -> TaskItem {
        try await client.query("task:read", args: ["id": id, "orgId": orgId])
    }
}

// swiftlint:enable file_types_order file_length
