import Foundation

/// Bundled attribution and canonical provenance for the exported icon catalog.
/// Files live in `Notices/` in the Swift Package resource bundle, including in
/// offline consumers. Hosts can read these URLs for their acknowledgements UI.
public enum TiptreeIconResources {
    public static var notice: URL? { url("NOTICE") }
    public static var apacheLicense: URL? { url("LICENSE") }
    public static var creativeCommonsLicense: URL? { url("LICENSE-CC-BY-4.0.txt") }
    public static var registry: URL? { url("icons.json") }

    private static func url(_ name: String) -> URL? {
        Bundle.module.url(forResource: name, withExtension: nil, subdirectory: "Notices")
    }
}
