<?php
// og-share.php - Social Media Open Graph Crawler Meta Generator for Single Page Applications (SPA)
// Intercepts Facebook, WhatsApp, Twitter, LinkedIn, Telegram, etc. to serve dynamic post title & thumbnail image.

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
$description = "Premium Touch is a premier luxury interior design & decor studio in Bangladesh. We craft bespoke residential and commercial spaces.";
$imageUrl = $domain . "/photo/hero/hero1.jpeg";
$fullUrl = $domain . $_SERVER['REQUEST_URI'];

if ($isSocialBot && count($segments) >= 2) {
    $type = strtolower($segments[0]);
    $slug = rawurldecode(end($segments));

    // Determine internal API URL based on request type
    $apiUrl = null;
    if ($type === 'blog' || $type === 'blogs') {
        $apiUrl = $domain . "/api/blogs/" . urlencode($slug);
    } elseif ($type === 'projects' || $type === 'project') {
        $apiUrl = $domain . "/api/projects/" . urlencode($slug);
    } elseif ($type === 'portfolio' || $type === 'portfolios') {
        $apiUrl = $domain . "/api/portfolios/" . urlencode($slug);
    }

    if ($apiUrl) {
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
                    } else {
                        $cleanImg = preg_replace('#^(public/|uploads/|storage/)#', '', $cleanImg);
                        $imageUrl = $domain . '/uploads/' . $cleanImg;
                    }
                }
            }
        }
    }

    header("Content-Type: text/html; charset=UTF-8");
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars($description, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:site_name" content="<?= htmlspecialchars($siteName, ENT_QUOTES, 'UTF-8') ?>" />
    <meta property="og:type" content="article" />
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
