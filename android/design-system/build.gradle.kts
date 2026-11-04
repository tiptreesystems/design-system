import groovy.json.JsonSlurper
import org.gradle.api.tasks.bundling.AbstractArchiveTask

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
    `maven-publish`
}

val tokenSource = JsonSlurper().parse(rootProject.file("../tokens/tokens.json")) as Map<*, *>
val sourceVersion = (tokenSource["meta"] as Map<*, *>)["version"] as String
group = "com.tiptreesystems"
version = providers.gradleProperty("androidVersion").orElse("$sourceVersion-android.local").get()
require(version == sourceVersion || version == "$sourceVersion-android.local") {
    "Android publication must match the canonical source version or its unpublished -android.local candidate"
}

android {
    namespace = "com.tiptreesystems.designsystem"
    compileSdk = 37
    defaultConfig {
        minSdk = 23
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
    sourceSets["main"].apply {
        kotlin.directories.add("src/main/generated/kotlin")
        res.srcDir("src/main/generated/res")
        assets.srcDir("src/main/generated/assets")
    }
    publishing { singleVariant("release") { withSourcesJar() } }
}

dependencies {
    constraints {
        implementation("androidx.lifecycle:lifecycle-runtime:2.10.0") {
            because("2.9.4 bundles lifecycle lint checks incompatible with AGP 9.5")
        }
    }
    api(platform("androidx.compose:compose-bom:2026.02.01"))
    api("androidx.compose.material3:material3")
    api("androidx.compose.ui:ui")
    api("androidx.compose.foundation:foundation")
    api("androidx.compose.animation:animation-core")
    debugImplementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation(platform("androidx.compose:compose-bom:2026.02.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test:runner:1.7.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}

publishing {
    repositories {
        // File-only staging: no registry URL or credentials, and no publication to mavenLocal.
        maven { name = "Candidate"; url = rootProject.layout.buildDirectory.dir("maven").get().asFile.toURI() }
    }
    publications {
        register<MavenPublication>("release") {
            artifactId = "design-system-android"
            pom {
                name.set("Tiptree Design System for Android")
                description.set("Generated tokens, semantic Compose themes and canonical icons.")
                url.set("https://github.com/tiptreesystems/design-system")
                licenses {
                    license { name.set("Apache-2.0"); url.set("https://www.apache.org/licenses/LICENSE-2.0") }
                    license { name.set("CC-BY-4.0 (Solar artwork)"); url.set("https://creativecommons.org/licenses/by/4.0/") }
                }
                scm { url.set("https://github.com/tiptreesystems/design-system") }
            }
        }
    }
}
afterEvaluate { publishing.publications.named<MavenPublication>("release") { from(components["release"]) } }

tasks.withType<AbstractArchiveTask>().configureEach {
    isPreserveFileTimestamps = false
    isReproducibleFileOrder = true
}
tasks.register<Zip>("candidateArchive") {
    dependsOn("publishReleasePublicationToCandidateRepository")
    from(rootProject.layout.buildDirectory.dir("maven")) {
        include("com/tiptreesystems/design-system-android/${project.version}/**")
    }
    archiveFileName.set("tiptree-design-system-android-${project.version}-maven.zip")
    destinationDirectory.set(rootProject.layout.buildDirectory.dir("candidate"))
}
