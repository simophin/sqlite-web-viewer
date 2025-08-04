plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlinx.serialization)
    `maven-publish`
    signing
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


    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(libs.ktor.server.cio)
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

publishing {
    publications {
        create<MavenPublication>("release") {
            groupId = project.group.toString()
            artifactId = project.name
            version = project.version.toString()

            afterEvaluate {
                from(components["release"])
            }
        }
    }
    repositories {
        maven {
            name = "local"
            url = uri(layout.buildDirectory.dir("repo"))
        }
    }
}
