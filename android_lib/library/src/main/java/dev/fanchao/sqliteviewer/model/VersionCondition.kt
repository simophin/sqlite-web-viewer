package dev.fanchao.sqliteviewer.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

sealed interface VersionCondition {
    data class AtLeast(val version: Version, val inclusive: Boolean) : VersionCondition
    data class AtMost(val version: Version, val inclusive: Boolean) : VersionCondition
    data class Exactly(val version: Version) : VersionCondition
}

object VersionCondSerializer : KSerializer<VersionCondition> {
    override val descriptor: SerialDescriptor = SerialDescriptor(
        "VersionCondition",
        String.serializer().descriptor
    )

    override fun serialize(
        encoder: Encoder,
        value: VersionCondition
    ) {
        when (value) {
            is VersionCondition.AtLeast -> encoder.encodeString(">${if (value.inclusive) "=" else ""}${value.version}")
            is VersionCondition.AtMost -> encoder.encodeString("<${if (value.inclusive) "=" else ""}${value.version}")
            is VersionCondition.Exactly -> encoder.encodeString("=${value.version}")
        }
    }

    override fun deserialize(decoder: Decoder): VersionCondition {
        val str = decoder.decodeString()
        return when {
            str.startsWith(">=") -> VersionCondition.AtLeast(Version.fromString(str.substring(2)), inclusive = true)
            str.startsWith(">") -> VersionCondition.AtLeast(Version.fromString(str.substring(1)), inclusive = false)
            str.startsWith("<=") -> VersionCondition.AtMost(Version.fromString(str.substring(2)), inclusive = true)
            str.startsWith("<") -> VersionCondition.AtMost(Version.fromString(str.substring(1)), inclusive = false)
            str.startsWith("=") -> VersionCondition.Exactly(Version.fromString(str.substring(1)))
            else -> throw IllegalArgumentException("Invalid version condition format: $str")
        }
    }
}

data class Version(val major: Int, val minor: Int, val patch: Int): Comparable<Version> {
    override fun toString(): String {
        return "$major.$minor.$patch"
    }

    override fun compareTo(other: Version): Int {
        return when {
            major != other.major -> major - other.major
            minor != other.minor -> minor - other.minor
            else -> patch - other.patch
        }
    }

    companion object {
        fun fromString(s: String): Version {
            val (major, minor, patch) = s.splitToSequence('.')
                .map { it.toInt() }
                .toList()
            return Version(major, minor, patch)
        }
    }
}