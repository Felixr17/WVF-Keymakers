<?php
/**
 * Keymakers override of humhub/widgets/views/footerNavigation_login.php (HumHub 1.18.6).
 * Adds the invitation-only notice and WVF links; the core footer entries are unchanged.
 */

use humhub\helpers\Html;
use humhub\modules\ui\menu\MenuLink;
use humhub\widgets\PoweredBy;

/* @var $this \humhub\components\View */
/* @var $entries MenuLink[] */
/* @var $options array */
/* @var $menu \humhub\widgets\FooterMenu */

?>

<div class="km-notice" role="note">
    <strong>The Keymakers Community Circle is invitation-only.</strong>
    Accounts are created by Women&rsquo;s Venture Fund after review and approval.
    Registering, sharing your key, or paying for membership does not create an account on its own.
    Approved members sign in here and see the spaces open to them.
</div>

<?= $this->renderFile(__DIR__ . '/_keymakersLinks.php') ?>

<div class="text text-center powered">
    <?php if (!empty($entries)): ?>
        <div class="footer-nav footer-nav-login">
            <?php foreach ($entries as $k => $entry): ?>
                <?php if ($entry instanceof MenuLink): ?>
                    <?= Html::a($entry->getLabel(), $entry->getUrl(), $entry->getHtmlOptions(['data-pjax-prevent' => true])); ?>
                <?php endif; ?>

                <?php if (array_key_last($entries) !== $k): ?>
                    &nbsp;&middot;&nbsp;
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
    <br/>
    <?= PoweredBy::widget(); ?>
</div>
