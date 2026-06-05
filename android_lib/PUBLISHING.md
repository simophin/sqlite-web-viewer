# Publishing the KMP module

The library module is published as a Kotlin Multiplatform artifact:

```kotlin
dependencies {
    implementation("io.github.simophin:sqlite-web-viewer:<version>")
}
```

Published targets:

- Android release AAR
- JVM
- iOS Arm64
- iOS Simulator Arm64
- iOS X64
- Kotlin Multiplatform metadata

## Local verification

From `android_lib`, publish all KMP variants to Maven Local:

```sh
cd ../webapp
npm ci
npm run build
cd ../android_lib
ANDROID_HOME=/path/to/android/sdk ./gradlew :sqlite-web-viewer:publishToMavenLocal
```

Signing is only enabled when the `signingInMemoryKey` Gradle property is present, so local publishing does not require release credentials.

## Maven Central release

Create and push a tag named `release/<version>`, for example:

```sh
git tag release/0.1.0
git push origin release/0.1.0
```

The GitHub Actions workflow derives the published version from the tag by stripping `release/`. It publishes from macOS so the iOS artifacts can be built and included in the KMP publication.

Required repository secrets:

- `MAVEN_CENTRAL_USERNAME`
- `MAVEN_CENTRAL_PASSWORD`
- `GPG_SIGNING_IN_MEMORY_KEY`
- `GPG_SIGNING_IN_MEMORY_KEY_ID`
- `GPG_SIGNING_IN_MEMORY_KEY_PASSWORD`
