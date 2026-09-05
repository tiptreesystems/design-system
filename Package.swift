// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "TiptreeDesignSystem",
    platforms: [
        .iOS(.v17),
    ],
    products: [
        .library(
            name: "TiptreeDesignSystem",
            targets: ["TiptreeDesignSystem"]
        ),
    ],
    targets: [
        .target(name: "TiptreeDesignSystem"),
    ]
)
