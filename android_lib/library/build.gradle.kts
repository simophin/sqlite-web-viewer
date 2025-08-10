plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlinx.serialization)
    alias(libs.plugins.publish)
}

group = "io.github.simophin"
version = System.getenv("VERSION") ?: "dev-snapshot"

kotlin {
    androidTarget()
    iosX64()
    iosArm64 {
        binaries {
            framework {
                baseName = "sqliteviewer"
            }
        }
    }
    iosSimulatorArm64()
    jvm {
        mainRun {
            mainClass.set("dev.fanchao.sqliteviewer.ServerKt")
        }
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(libs.ktor.server.cio)
                implementation(libs.ktor.server.cors)
                implementation(libs.ktor.server.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)
                implementation(libs.kotlinx.io)
            }
        }
        val androidMain by getting {
            dependencies {
                implementation(libs.androidx.core.ktx)
                implementation(libs.androidx.activity)
                implementation(libs.androidx.sqlite)
                implementation(libs.kotlinx.io.jvm)
            }
        }
        val iosMain by creating {
            dependsOn(commonMain)
        }
        val iosX64Main by getting { dependsOn(iosMain) }
        val iosArm64Main by getting { dependsOn(iosMain) }
        val iosSimulatorArm64Main by getting { dependsOn(iosMain) }

        val jvmMain by getting {
            dependencies {
                implementation(libs.androidx.sqlite.bundled)
                runtimeOnly(libs.slf4j.simple)
            }
        }
    }

    jvmToolchain(21)
}

android {
    namespace = "dev.fanchao.sqliteviewer"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }

    buildFeatures {
        viewBinding = true
    }
}

mavenPublishing {
    publishToMavenCentral()

    signAllPublications()
}

mavenPublishing {
    coordinates(groupId = group.toString(), "sqlite-web-viewer", version.toString())

    pom {
        name.set("SQLite Web Viewer")
        description.set("View SQLite databases in a web browser with a simple interface.")
        inceptionYear.set("2025")
        url.set("https://github.com/simophin/sqlite-web-viewer/")
        licenses {
            license {
                name.set("The Apache License, Version 2.0")
                url.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
                distribution.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
            }
        }
        developers {
            developer {
                id.set("simophin")
                name.set("Fanchao L")
                url.set("https://github.com/simophin/")
            }
        }
        scm {
            url.set("https://github.com/simophin/sqlite-web-viewer/")
            connection.set("scm:git:git://github.com/simophin/sqlite-web-viewer.git")
            developerConnection.set("scm:git:ssh://git@github.com/simophin/sqlite-web-viewer.git")
        }
    }
}
