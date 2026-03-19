import WindowsIcon from '../assets/icons/windows.svg?react';
import AppleIcon from '../assets/icons/apple.svg?react';
import AndroidIcon from '../assets/icons/android.svg?react';
import LinuxIcon from '../assets/icons/tux.svg?react';
import UnknownIcon from '../assets/icons/unknown.svg?react';

export const parseUserAgent = (uaString) => {
    if (!uaString) {
        return { os: 'Unknown OS', browser: 'Unknown Browser', OsIcon: UnknownIcon, BrowserIcon: UnknownIcon };
    }

    const ua = uaString.toLowerCase();

    const osRules = [
        { match: /windows/, name: 'Windows', Icon: WindowsIcon },
        { match: /mac os|macintosh/, name: 'macOS', Icon: AppleIcon },
        { match: /android/, name: 'Android', Icon: AndroidIcon },
        { match: /iphone|ipad/, name: 'iOS', Icon: AppleIcon },
        { match: /linux/, name: 'Linux', Icon: LinuxIcon },
    ];

    const browserRules = [
        { match: /edg/, name: 'Edge'},
        { match: /opr|opera/, name: 'Opera'},
        { match: /firefox/, name: 'Firefox'},
        { match: /chrome/, name: 'Chrome'},
        { match: /safari/, name: 'Safari'},
    ];

    const osMatch = osRules.find(rule => rule.match.test(ua));
    const browserMatch = browserRules.find(rule => rule.match.test(ua));

    return {
        os: osMatch?.name || 'Unknown OS',
        OsIcon: osMatch?.Icon || UnknownIcon,
        browser: browserMatch?.name || 'Unknown Browser',
        BrowserIcon: browserMatch?.Icon || UnknownIcon,
    };
};