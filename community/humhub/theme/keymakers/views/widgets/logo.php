<?php
/**
 * Keymakers override of humhub/widgets/views/logo.php (HumHub 1.18.6).
 * An admin-uploaded logo (Administration > Settings > Appearance) still wins;
 * otherwise the Keymakers key mark from the public website is shown.
 */

use humhub\helpers\Html;
use humhub\libs\LogoImage;
use humhub\widgets\SiteLogo;

/**
 * @var $this \humhub\components\View
 * @var $place string
 * @var $maxWidth int
 * @var $maxHeight int
 * @var $id string
 * @var $class string
 */

$appName = Html::encode(Yii::$app->name);
$hasLogoImage = LogoImage::hasImage();
$markUrl = $this->theme->getBaseUrl() . '/resources/img/keymakers-logo.svg';
?>

<?php if ($place === SiteLogo::PLACE_TOP_MENU) : ?>
    <a class="navbar-brand" href="<?= Yii::$app->homeUrl ?>">
        <?php if ($hasLogoImage) : ?>
            <?= Html::img(LogoImage::getUrl($maxWidth, $maxHeight), ['id' => $id, 'class' => $class, 'alt' => $appName]) ?>
        <?php else: ?>
            <img src="<?= $markUrl ?>" class="km-logo" alt="">
            <span class="km-brand-text"><?= $appName ?></span>
        <?php endif; ?>
    </a>
<?php endif; ?>

<?php if ($place === SiteLogo::PLACE_LOGIN) : ?>
    <?php if ($hasLogoImage) : ?>
        <a href="<?= Yii::$app->homeUrl ?>" data-pjax-prevent>
            <?= Html::img(LogoImage::getUrl($maxWidth, $maxHeight), ['id' => $id, 'class' => $class, 'alt' => $appName]) ?>
        </a>
        <br>
    <?php else: ?>
        <img src="<?= $markUrl ?>" class="km-logo-login" alt="Keymakers">
        <h1 id="app-title" class="animated fadeIn"><?= $appName ?></h1>
        <p class="text-white-50 mb-3">A Women&rsquo;s Venture Fund community</p>
    <?php endif; ?>
<?php endif; ?>
