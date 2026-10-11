<?php
/**
 * Keymakers override of humhub/widgets/views/footerNavigation_sidebar.php (HumHub 1.18.6).
 * Adds WVF links above the core footer entries.
 */

use humhub\helpers\Html;
use humhub\modules\ui\menu\MenuLink;
use humhub\widgets\LanguageChooser;
use humhub\widgets\PoweredBy;

/* @var $this \humhub\components\View */
/* @var $entries MenuLink[] */
/* @var $options array */
/* @var $menu \humhub\widgets\FooterMenu */

?>

<?= $this->renderFile(__DIR__ . '/_keymakersLinks.php') ?>

<div class="footer-nav footer-nav-sidebar">
    <small>
        <?php foreach ($entries as $k => $entry): ?>
            <?php if ($entry instanceof MenuLink): ?>
                <?= Html::a($entry->getLabel(), $entry->getUrl(), $entry->getHtmlOptions()); ?>
            <?php endif; ?>

            <?php if (!PoweredBy::isHidden() || array_key_last($entries) !== $k): ?>
                &nbsp;&middot;&nbsp;
            <?php endif; ?>

        <?php endforeach; ?>

        <?= PoweredBy::widget(); ?>

        <?= LanguageChooser::widget() ?>
    </small>
</div>
<br/>
