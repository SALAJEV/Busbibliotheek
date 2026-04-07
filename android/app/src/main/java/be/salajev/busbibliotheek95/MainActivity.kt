package be.salajev.busbibliotheek95

import android.Manifest
import android.content.ContentValues
import android.provider.MediaStore
import java.io.OutputStream
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import androidx.core.net.toUri
import androidx.core.view.WindowCompat
import be.salajev.busbibliotheek95.ui.theme.Busbibliotheek95Theme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Busbibliotheek95Theme {
                val context = LocalContext.current
                val isNetworkAvailable by observeConnectivity(context).collectAsState(initial = isNetworkAvailable(context))
                val isDarkTheme = isSystemInDarkTheme()
                
                val startUrl = remember {
                    val intentData = (context as Activity).intent?.dataString
                    if (intentData != null && intentData.contains("busbibliotheek95.pages.dev")) {
                        intentData
                    } else {
                        "https://busbibliotheek95.pages.dev/"
                    }
                }
                
                var updateStatus by remember { mutableStateOf<UpdateStatus>(UpdateStatus.None) }
                val currentVersion = remember { getAppVersion(context) }

                LaunchedEffect(isNetworkAvailable) {
                    if (isNetworkAvailable) {
                        checkUpdate(currentVersion) { status ->
                            updateStatus = status
                        }
                    }
                }

                val permissionsToRequest = remember {
                    mutableListOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ).apply {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }.toTypedArray()
                }

                val launcher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { _ -> }

                LaunchedEffect(Unit) {
                    launcher.launch(permissionsToRequest)
                }

                val siteColor = if (isDarkTheme) Color(0xFF121212) else Color(0xFFFFFFFF)
                
                SideEffect {
                    val window = (context as Activity).window
                    WindowCompat.getInsetsController(window, window.decorView).apply {
                        isAppearanceLightStatusBars = !isDarkTheme
                        isAppearanceLightNavigationBars = !isDarkTheme
                    }
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = siteColor
                ) { innerPadding ->
                    when {
                        !isNetworkAvailable -> {
                            NoInternetDialog(
                                onRetry = { /* Flow will auto-update */ },
                                onOpenSettings = { startActivity(Intent(Settings.ACTION_WIFI_SETTINGS)) }
                            )
                        }
                        updateStatus is UpdateStatus.Critical -> {
                            UpdateDialog(
                                isCritical = true,
                                onUpdate = { openUpdateLink(context) },
                                onDismiss = { /* No dismiss for critical */ }
                            )
                        }
                        else -> {
                            Box(modifier = Modifier.padding(innerPadding)) {
                                WebViewScreen(
                                    url = startUrl,
                                    modifier = Modifier.fillMaxSize(),
                                    siteColor = siteColor
                                )
                                
                                if (updateStatus is UpdateStatus.Available) {
                                    UpdateDialog(
                                        isCritical = false,
                                        onUpdate = { openUpdateLink(context) },
                                        onDismiss = { updateStatus = UpdateStatus.None }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun observeConnectivity(context: Context): Flow<Boolean> = callbackFlow {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { trySend(true) }
            override fun onLost(network: Network) { trySend(false) }
            override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                        capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                trySend(hasInternet)
            }
        }
        
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, callback)
        
        awaitClose { connectivityManager.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()

    private suspend fun checkUpdate(currentVersion: String, onResult: (UpdateStatus) -> Unit) {
        withContext(Dispatchers.IO) {
            try {
                val url = URL("https://pub-611b5bc156eb455ba86d9bcece9aea1c.r2.dev/app_version.json")
                val connection = url.openConnection() as HttpURLConnection
                val text = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(text)
                val remoteVersion = json.getString("version")
                val releaseDateStr = json.getString("release_date")
                
                if (isVersionNewer(remoteVersion, currentVersion)) {
                    val releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE)
                    val monthsDiff = ChronoUnit.MONTHS.between(releaseDate, LocalDate.now())
                    
                    withContext(Dispatchers.Main) {
                        if (monthsDiff >= 3) {
                            onResult(UpdateStatus.Critical)
                        } else {
                            onResult(UpdateStatus.Available)
                        }
                    }
                }
            } catch (_: Exception) { }
        }
    }

    private fun isVersionNewer(remote: String, local: String): Boolean {
        val remoteParts = remote.split(".").mapNotNull { it.toIntOrNull() }
        val localParts = local.split(".").mapNotNull { it.toIntOrNull() }
        val length = maxOf(remoteParts.size, localParts.size)
        for (i in 0 until length) {
            val r = remoteParts.getOrElse(i) { 0 }
            val l = localParts.getOrElse(i) { 0 }
            if (r > l) return true
            if (r < l) return false
        }
        return false
    }

    private fun openUpdateLink(context: Context) {
        val url = "https://busbibliotheek95.pages.dev/android/app/release/app-release.apk"
        try {
            val intent = Intent(Intent.ACTION_VIEW, url.toUri())
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "Update mislukt: Verwijder de app en installeer deze opnieuw via de officiële website van Busspotter 95", Toast.LENGTH_LONG).show()
        }
    }

    private fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = ContextCompat.getSystemService(context, ConnectivityManager::class.java) ?: return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            return activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                    activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && networkInfo.isConnected
        }
    }
}

sealed class UpdateStatus {
    object None : UpdateStatus()
    object Available : UpdateStatus()
    object Critical : UpdateStatus()
}

@Composable
fun UpdateDialog(isCritical: Boolean, onUpdate: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = { if (!isCritical) onDismiss() },
        title = { Text(text = if (isCritical) "Update Verplicht" else "Update Beschikbaar") },
        text = { 
            Text(text = if (isCritical) 
                "Je app is meer dan 3 maanden verouderd en moet geüpdatet worden om verder te kunnen gaan." 
                else "Er is een nieuwe versie van de Busbibliotheek app beschikbaar.") 
        },
        confirmButton = { 
            Button(onClick = onUpdate) { Text(text = "Update Nu") } 
        },
        dismissButton = {
            if (!isCritical) {
                TextButton(onClick = onDismiss) { Text(text = "Later") }
            }
        }
    )
}

@Composable
fun WebViewScreen(url: String, modifier: Modifier = Modifier, siteColor: Color) {
    var webViewInstance: WebView? by remember { mutableStateOf(null) }
    val isDarkTheme = isSystemInDarkTheme()
    val context = LocalContext.current
    val leavingAppMessage = stringResource(id = R.string.leaving_app)
    
    var progress by remember { mutableFloatStateOf(0f) }
    var lastBackPressTime by remember { mutableLongStateOf(0L) }

    var filePathCallback: ValueCallback<Array<Uri>>? by remember { mutableStateOf(null) }
    val fileChooserLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
        filePathCallback = null
    }

    BackHandler {
        if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        } else {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastBackPressTime < 2000) {
                (context as Activity).finish()
            } else {
                lastBackPressTime = currentTime
                Toast.makeText(context, context.getString(R.string.exit_toast), Toast.LENGTH_SHORT).show()
            }
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    setBackgroundColor(siteColor.toArgb())
                    isVerticalScrollBarEnabled = false
                    isHorizontalScrollBarEnabled = false
                    overScrollMode = View.OVER_SCROLL_NEVER
                    
                    CookieManager.getInstance().setAcceptCookie(true)
                    CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                    
                    settings.apply {
                        @Suppress("SetJavaScriptEnabled")
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        setSupportZoom(false)
                        builtInZoomControls = false
                        displayZoomControls = false
                        textZoom = 100
                        mediaPlaybackRequiresUserGesture = false
                        setGeolocationEnabled(true)
                        allowFileAccess = true
                        allowContentAccess = true
                        javaScriptCanOpenWindowsAutomatically = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                        setSupportMultipleWindows(true)
                        
                        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
                            WebSettingsCompat.setSafeBrowsingEnabled(this, true)
                        }
                        
                        val originalUA = userAgentString
                        val appVersion = getAppVersion(context)
                        userAgentString = "$originalUA BusbibliotheekApp/$appVersion"
                    }
                    
                    addJavascriptInterface(object {
                        @Suppress("unused")
                        @JavascriptInterface
                        fun processDownload(base64Data: String, contentType: String) {
                            try {
                                val pureBase64 = base64Data.substringAfter("base64,")
                                val bytes = android.util.Base64.decode(pureBase64, android.util.Base64.DEFAULT)
                                val fileName = "Busfiche_${System.currentTimeMillis()}.${if (contentType.contains("pdf")) "pdf" else "bin"}"
                                
                                val resolver = context.contentResolver
                                val contentValues = ContentValues().apply {
                                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                                    put(MediaStore.MediaColumns.MIME_TYPE, contentType)
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                                    }
                                }
                                
                                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                                uri?.let {
                                    resolver.openOutputStream(it).use { outputStream ->
                                        outputStream?.write(bytes)
                                    }
                                    (context as Activity).runOnUiThread {
                                        Toast.makeText(context, context.getString(R.string.download_started), Toast.LENGTH_SHORT).show()
                                    }
                                } ?: throw Exception("Failed to create MediaStore entry")
                                
                            } catch (e: Exception) {
                                (context as Activity).runOnUiThread {
                                    Toast.makeText(context, context.getString(R.string.download_failed), Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    }, "Android")

                    isLongClickable = false
                    setOnLongClickListener { true }

                    updateDarkMode(this, isDarkTheme)
                    
                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            progress = newProgress / 100f
                        }
                        override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                            callback?.invoke(origin, true, false)
                        }
                        override fun onPermissionRequest(request: PermissionRequest?) {
                            (context as Activity).runOnUiThread { request?.grant(request.resources) }
                        }
                        override fun onShowFileChooser(webView: WebView?, filePathCallbackIn: ValueCallback<Array<Uri>>?, fileChooserParams: FileChooserParams?): Boolean {
                            filePathCallback?.onReceiveValue(null)
                            filePathCallback = filePathCallbackIn
                            fileChooserLauncher.launch("*/*")
                            return true
                        }
                        override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean {
                            val newWebView = WebView(context)
                            newWebView.webViewClient = object : WebViewClient() {
                                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                                    val uri = request?.url ?: return false
                                    CustomTabsIntent.Builder().build().launchUrl(context, uri)
                                    return true
                                }
                            }
                            val transport = resultMsg?.obj as? WebView.WebViewTransport
                            transport?.webView = newWebView
                            resultMsg?.sendToTarget()
                            return true
                        }
                    }

                    setDownloadListener { downloadUrl, userAgent, contentDisposition, mimetype, _ ->
                        if (downloadUrl.startsWith("blob:")) {
                            loadUrl("javascript:(function(){" +
                                    "var xhr = new XMLHttpRequest();" +
                                    "xhr.open('GET', '$downloadUrl', true);" +
                                    "xhr.responseType = 'blob';" +
                                    "xhr.onload = function(e) {" +
                                    "  if (this.status == 200) {" +
                                    "    var reader = new FileReader();" +
                                    "    reader.readAsDataURL(this.response);" +
                                    "    reader.onloadend = function() { Android.processDownload(reader.result, '$mimetype'); }" +
                                    "  }" +
                                    "};" +
                                    "xhr.send();" +
                                    "})()")
                            return@setDownloadListener
                        }
                        val fileName = URLUtil.guessFileName(downloadUrl, contentDisposition, mimetype)
                        android.app.AlertDialog.Builder(context)
                            .setTitle(context.getString(R.string.download_title))
                            .setMessage(context.getString(R.string.download_message, fileName))
                            .setPositiveButton(context.getString(R.string.download_button)) { _, _ ->
                                try {
                                    val request = DownloadManager.Request(downloadUrl.toUri())
                                    request.setMimeType(mimetype)
                                    request.addRequestHeader("cookie", CookieManager.getInstance().getCookie(downloadUrl))
                                    request.addRequestHeader("User-Agent", userAgent)
                                    request.setTitle(fileName)
                                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                                    ContextCompat.getSystemService(context, DownloadManager::class.java)?.enqueue(request)
                                    Toast.makeText(context, context.getString(R.string.download_started), Toast.LENGTH_SHORT).show()
                                } catch (_: Exception) {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, downloadUrl.toUri()))
                                }
                            }
                            .setNegativeButton(context.getString(R.string.cancel), null)
                            .show()
                    }

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val uri = request?.url ?: return false
                            val urlString = uri.toString()
                            val host = uri.host ?: ""
                            val mainDomain = "busbibliotheek95.pages.dev"
                            
                            if (urlString.startsWith("tel:") || urlString.startsWith("mailto:") || urlString.startsWith("whatsapp:")) {
                                try { context.startActivity(Intent(Intent.ACTION_VIEW, uri)); return true } catch (_: Exception) { return false }
                            }
                            if (host.contains("delijn.be") || urlString.contains("delijn://")) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, uri)
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    context.startActivity(intent)
                                    return true
                                } catch (_: Exception) { if (urlString.startsWith("delijn://")) return true }
                            }
                            if (host.isNotEmpty() && !host.endsWith(mainDomain)) {
                                Toast.makeText(context, leavingAppMessage, Toast.LENGTH_SHORT).show()
                                try {
                                    CustomTabsIntent.Builder().setShowTitle(true).setShareState(CustomTabsIntent.SHARE_STATE_ON).build().launchUrl(context, uri)
                                } catch (_: Exception) {
                                    try { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) } catch (_: Exception) {}
                                }
                                return true
                            }
                            return false
                        }
                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            view?.loadUrl("javascript:(function() { " +
                                    "var style = document.createElement('style');" +
                                    "style.innerHTML = '*{ -webkit-tap-highlight-color: transparent; outline: none; } " +
                                    "body { -webkit-user-select: auto; } " +
                                    ".install-app-button, #install-banner { display: none !important; }';" +
                                    "document.head.appendChild(style);" +
                                    "})()")
                        }
                        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                            // Handled by observeConnectivity in Scaffold
                        }
                    }
                    loadUrl(url)
                    webViewInstance = this
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { view -> updateDarkMode(view, isDarkTheme) }
        )

        if (progress < 1.0f) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(2.dp).align(Alignment.TopCenter),
                color = if (isDarkTheme) Color.White else Color(0xFF2196F3),
                trackColor = Color.Transparent,
            )
        }
    }
}

private fun updateDarkMode(webView: WebView, isDarkTheme: Boolean) {
    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
        WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, isDarkTheme)
    }
    webView.setBackgroundColor(if (isDarkTheme) "#121212".toColorInt() else android.graphics.Color.WHITE)
}

private fun getAppVersion(context: Context): String {
    return try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0)).versionName
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(context.packageName, 0).versionName
        } ?: "1.67"
    } catch (_: Exception) { "1.67" }
}

@Composable
fun NoInternetDialog(onRetry: () -> Unit, onOpenSettings: () -> Unit) {
    AlertDialog(
        onDismissRequest = { },
        title = { Text(text = stringResource(id = R.string.no_internet_title)) },
        text = { Text(text = stringResource(id = R.string.no_internet_text)) },
        confirmButton = { Button(onClick = onRetry) { Text(text = stringResource(id = R.string.retry)) } },
        dismissButton = { TextButton(onClick = onOpenSettings) { Text(text = stringResource(id = R.string.settings)) } }
    )
}
