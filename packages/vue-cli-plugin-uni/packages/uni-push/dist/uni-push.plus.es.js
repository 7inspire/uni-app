function initPushNotification() {
    // 仅 App 端
    if (typeof plus !== 'undefined' && plus.push) {
        plus.globalEvent.addEventListener('newPath', ({ path }) => {
            if (!path) {
                return;
            }
            // 指定的页面为当前页面
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage &&
                currentPage.$page &&
                currentPage.$page.fullPath === path) {
                return;
            }
            // 简单起见，先尝试 navigateTo 跳转，失败后，再尝试 tabBar 跳转
            uni.navigateTo({
                url: path,
                fail(res) {
                    if (res.errMsg.indexOf('tabbar') > -1) {
                        uni.switchTab({
                            url: path,
                            fail(res) {
                                console.error(res.errMsg);
                            },
                        });
                    }
                    else {
                        console.error(res.errMsg);
                    }
                },
            });
        });
        plus.push.addEventListener('click', (result) => {
            // @ts-expect-error
            uni.invokePushCallback({
                type: 'click',
                message: result,
            });
        });
        uni.onPushMessage((res) => {
            if (res.type === 'receive' &&
                res.data &&
                res.data.force_notification) {
                // 创建通知栏
                uni.createPushMessage(res.data);
                res.stopped = true;
            }
        });
    }
}

// @ts-expect-error
uni.invokePushCallback({
    type: 'enabled',
    offline: true,
});
Promise.resolve().then(() => {
    initPushNotification();
    plus.push.setAutoNotification && plus.push.setAutoNotification(false);
    plus.push.addEventListener('receive', (result) => {
        // @ts-expect-error
        uni.invokePushCallback({
            type: 'pushMsg',
            message: result,
        });
    });
});
