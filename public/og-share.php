<?php
// og-share.php - Social Media Open Graph Crawler Meta Generator for Single Page Applications (SPA)
// Intercepts Facebook, WhatsApp, Twitter, LinkedIn, Telegram, etc. to serve dynamic website/post title & social banner.

$userAgent = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
$isSocialBot = preg_match('/(facebookexternalhit|facebookcatalog|twitterbot|whatsapp|linkedinbot|telegrambot|slackbot|pinterest|googlebot|bingbot)/i', $userAgent);

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = trim($path, '/');
$segments = array_values(array_filter(explode('/', $path)));

$siteName = "Premium Touch Interior Decor Studio";
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'] ?? 'www.premiumtouchbd.com';
$domain = $protocol . "://" . $host;

$title = "Premium Touch | Luxury Interior Design & Architecture Studio";
$description = "Premium Touch is a premier luxury interior design & decor studio in Bangladesh. We craft bespoke residential and commercial spaces with exceptional elegance.";
$imageUrl = $domain . "/photo/hero/hero1.jpeg";
$fullUrl = $domain . $_SERVER['REQUEST_URI'];

$ctx = stream_context_create([
    'http' => [
        'timeout' => 3,
        'header' => "Accept: application/json\r\nUser-Agent: OG-Share-Bot/1.0\r\n"
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
]);

$backendApiBase = $domain . "/backend/public/api";

// 1. Fetch main site_info for site-wide social banner
$siteJson = @file_get_contents($backendApiBase . "/site-info", false, $ctx);
if (!$siteJson) {
    $backendApiBase = $domain . "/api";
    $siteJson = @file_get_contents($backendApiBase . "/site-info", false, $ctx);
}

if ($siteJson) {
    $siteData = json_decode($siteJson, true);
    if ($siteData) {
        if (!empty($siteData['site_name'])) $siteName = $siteData['site_name'];
        if (!empty($siteData['tagline'])) $title = $siteData['site_name'] . " | " . $siteData['tagline'];
        if (!empty($siteData['short_description'])) $description = $siteData['short_description'];
        if (!empty($siteData['og_image'])) {
            $cleanOg = ltrim($siteData['og_image'], '/');
            if (strpos($cleanOg, 'http') === 0) {
                $imageUrl = $cleanOg;
            } else {
                $cleanOg = preg_replace('#^(public/|uploads/|storage/|logo/)#', '', $cleanOg);
                $imageUrl = $domain . '/uploads/logo/' . $cleanOg;
            }
        }
    }
}

// 2. If social bot & specific item URL, fetch item title & image
if ($isSocialBot && count($segments) >= 2) {
    $type = strtolower($segments[0]);
    $slug = rawurldecode(end($segments));

    $apiUrl = null;
    if ($type === 'blog' || $type === 'blogs') {
        $apiUrl = $backendApiBase . "/blogs/" . urlencode($slug);
    } elseif ($type === 'projects' || $type === 'project') {
        $apiUrl = $backendApiBase . "/projects/" . urlencode($slug);
    } elseif ($type === 'portfolio' || $type === 'portfolios') {
        $apiUrl = $backendApiBase . "/portfolios/" . urlencode($slug);
    }

    if ($apiUrl) {
        $json = @file_get_contents($apiUrl, false, $ctx);
        if ($json) {
            $data = json_decode($json, true);
            if ($data && !empty($data['title'])) {
                $title = $data['title'] . " | " . $siteName;
                
                $rawDesc = $data['short_description'] ?? $data['content'] ?? $data['description'] ?? '';
                if ($rawDesc) {
                    $cleanDesc = trim(preg_replace('/\s+/', ' ', strip_tags($rawDesc)));
                    $description = mb_substr($cleanDesc, 0, 160) . (mb_strlen($cleanDesc) > 160 ? '...' : '');
                }

                $imgRelPath = null;
                if (!empty($data['thumbnail']['image_path'])) {
                    $imgRelPath = $data['thumbnail']['image_path'];
                } elseif (!empty($data['images'][0]['image_path'])) {
                    $imgRelPath = $data['images'][0]['image_path'];
                }

                if ($imgRelPath) {
                    $cleanImg = ltrim($imgRelPath, '/');
                    if (strpos($cleanImg, 'http') === 0) {
                        $imageUrl = $cleanImg;
                    } elseif (strpos($cleanImg, 'uploads/') === 0 || strpos($cleanImg, 'storage/') === 0) {
                        $imageUrl = $domain . '/' . $cleanImg;
                    } else {
                        $cleanImg = preg_replace('#^(public/|uploads/|storage/)#', '', $cleanImg);
                        $imageUrl = $domain . '/uploads/' . $cleanImg;
                    }
                }
            }
        }
    }
}

if ($isSocialBot) {
    header("Content-Type: text/html; charset=UTF-8");
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:site_name" content="<?= htmlspecialchars($siteName, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:url" content="<?= htmlspecialchars($fullUrl, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:image:secure_url" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>" />
    <meta name="twitter:image" content="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>" />
</head>
<body>
    <h1><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></h1>
    <p><?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?></p>
    <img src="<?= htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>">
</body>
</html>
    <?php
    exit;
}

// Serve index.html for human visitors
if (file_exists(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
}
exit;
