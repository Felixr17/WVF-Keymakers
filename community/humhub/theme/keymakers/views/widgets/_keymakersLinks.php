<?php
/**
 * Women's Venture Fund links shown in every Keymakers footer.
 * URLs come from env (HUMHUB_CONFIG__PARAMS__KEYMAKERS_*_URL). Only https:// and
 * mailto: are rendered as links; anything else shows a "coming soon" placeholder.
 */

use humhub\helpers\Html;

$links = [
    ['label' => "Return to Women\u{2019}s Venture Fund", 'param' => 'keymakersReturnUrl'],
    ['label' => 'Community Rules', 'param' => 'keymakersRulesUrl'],
    ['label' => 'Privacy', 'param' => 'keymakersPrivacyUrl'],
    ['label' => 'Support', 'param' => 'keymakersSupportUrl'],
];

$safe = static function ($url): ?string {
    $url = trim((string) $url);
    if ($url === '' || preg_match('/[\s"\'<>]/', $url)) {
        return null;
    }
    return (str_starts_with($url, 'https://') || str_starts_with($url, 'mailto:')) ? $url : null;
};
?>
<nav class="km-links" aria-label="Women&rsquo;s Venture Fund">
    <?php foreach ($links as $link): ?>
        <?php $url = $safe(Yii::$app->params[$link['param']] ?? ''); ?>
        <?php if ($url !== null): ?>
            <?= Html::a(Html::encode($link['label']), $url, ['data-pjax-prevent' => true]) ?>
        <?php else: ?>
            <span class="km-link-pending"><?= Html::encode($link['label']) ?> (coming soon)</span>
        <?php endif; ?>
    <?php endforeach; ?>
</nav>
