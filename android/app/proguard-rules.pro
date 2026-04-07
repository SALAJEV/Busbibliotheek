# Keep JavaScript interfaces
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Compose-related attributes
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Prevent shrinking of the update status sealed class and its objects
-keep class be.salajev.busbibliotheek95.UpdateStatus { *; }
-keep class be.salajev.busbibliotheek95.UpdateStatus$* { *; }
