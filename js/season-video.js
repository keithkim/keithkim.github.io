/**
 * Season-based video picker for background (New York timezone).
 *
 * To add/update videos: edit VIDEO_GROUPS below. Each season (spring, summer,
 * fall, winter) has an array of YouTube video IDs or full URLs. One video is
 * chosen at random for the current season based on the date in New York.
 *
 * Example:
 *   spring: [ "abc123", "https://www.youtube.com/watch?v=def456" ],
 *   winter: [ "jh_KFTYJnDo?t=9" ],  // ?t=9 = start at 9 seconds
 */
(function(global) {
    "use strict";

    /**
     * Video groups by season. Add YouTube video IDs or full URLs.
     * Each season can have one or more videos; one is chosen at random.
     */
    var VIDEO_GROUPS = {
        spring: [
            "0QKdqm5TX6c", "6g3QiE4IB-4", "YXOqmwN2FCg"
        ],
        summer: [
            "0QKdqm5TX6c", "p0SEFeL9PW4", "YyUhslfLfZM", "J_4leOeH9Lc", "MxcJtLbIhvs?t=12", "u_gD5ErXOvc"
        ],
        fall: [
            "0QKdqm5TX6c", "xK5_0OIpgRI", "wid7PEVrgRU", "0L38Z9hIi5s", "WEP5RV86r_M", "A7zZMXlaO5o"
        ],
        winter: [
            "0QKdqm5TX6c", "A7zZMXlaO5o", "ADDFmfOeihU?t=12", "jh_KFTYJnDo?t=10", "9c-MLSjSYDw"
        ]
    };

    var TIMEZONE = "America/New_York";

    /**
     * Get current date parts (month 1-12, day 1-31) in New York.
     */
    function getDateInNewYork() {
        var now = new Date();
        var formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: TIMEZONE,
            month: "numeric",
            day: "numeric"
        });
        var parts = formatter.formatToParts(now);
        var month = parseInt(parts.find(function(p) { return p.type === "month"; }).value, 10);
        var day = parseInt(parts.find(function(p) { return p.type === "day"; }).value, 10);
        return { month: month, day: day };
    }

    /**
     * Determine season from date (New York).
     * Winter: Dec 1 - Feb 20, Spring: Feb 21 - May 31,
     * Summer: Jun 1 - Aug 31, Fall: Sep 1 - Nov 30.
     */
    function getSeason(month, day) {
        if (month === 12 || month === 1 || (month === 2 && day <= 20)) return "winter";
        if ((month === 2 && day >= 21) || month === 3 || month === 4 || month === 5) return "spring";
        if (month === 6 || month === 7 || month === 8) return "summer";
        if (month === 9 || month === 10 || month === 11) return "fall";
        return "winter";
    }

    /**
     * Normalize to full YouTube watch URL. Optionally append &t=seconds for start time.
     */
    function toWatchUrl(id, startAt) {
        var s = String(id).trim();
        if (/^https?:\/\//i.test(s)) {
            var m = s.match(/[?&]v=([^&]+)/i);
            s = m ? m[1] : s;
        }
        var url = "https://www.youtube.com/watch?v=" + s;
        if (startAt != null && startAt > 0) url += "&t=" + startAt;
        return url;
    }

    /**
     * Parse entry (id or "id?t=9" or full URL with &t=9) into { id, startAt }.
     * startAt is seconds; undefined if not specified.
     */
    function parseEntry(entry) {
        var s = String(entry).trim();
        var id, startAt;
        if (/^https?:\/\//i.test(s)) {
            var vMatch = s.match(/[?&]v=([^&]+)/i);
            id = vMatch ? vMatch[1] : s;
            var tMatch = s.match(/[?&]t=(\d+)/i);
            startAt = tMatch ? parseInt(tMatch[1], 10) : undefined;
        } else {
            var parts = s.split(/[?&]/);
            id = parts[0];
            var tParam = s.match(/[?&]t=(\d+)/i);
            startAt = tParam ? parseInt(tParam[1], 10) : undefined;
        }
        return { id: id, startAt: startAt };
    }

    /**
     * Pick a random video for the current season (New York time).
     * Returns { url, startAt } or null. startAt is seconds (optional).
     */
    function getVideoUrl() {
        var d = getDateInNewYork();
        var season = getSeason(d.month, d.day);
        var list = VIDEO_GROUPS[season];
        if (!list || list.length === 0) return null;
        var index = Math.floor(Math.random() * list.length);
        var parsed = parseEntry(list[index]);
        return { url: toWatchUrl(parsed.id, parsed.startAt), startAt: parsed.startAt };
    }

    /**
     * Pick a random video from all seasons combined.
     * Returns { url, startAt } or null. startAt is seconds (optional).
     */
    function getRandomVideoUrl() {
        var all = [];
        var keys = ["spring", "summer", "fall", "winter"];
        for (var i = 0; i < keys.length; i++) {
            var list = VIDEO_GROUPS[keys[i]];
            if (list && list.length) all = all.concat(list);
        }
        if (all.length === 0) return null;
        var index = Math.floor(Math.random() * all.length);
        var parsed = parseEntry(all[index]);
        return { url: toWatchUrl(parsed.id, parsed.startAt), startAt: parsed.startAt };
    }

    /**
     * Extract video ID from a watch URL.
     */
    function getVideoIdFromUrl(url) {
        if (!url) return null;
        var m = String(url).match(/[?&]v=([^&]+)/i);
        if (m) return m[1];
        return String(url).split(/[?&]/)[0];
    }

    /**
     * Pick a random video from all seasons that is not the current URL.
     * Use when the current video fails to play (e.g. embed disabled on other site).
     * Returns { url, startAt } or null if no other video.
     */
    function getAnotherVideoUrl(currentUrl) {
        var currentId = getVideoIdFromUrl(currentUrl);
        var all = [];
        var keys = ["spring", "summer", "fall", "winter"];
        for (var i = 0; i < keys.length; i++) {
            var list = VIDEO_GROUPS[keys[i]];
            if (list && list.length) all = all.concat(list);
        }
        var others = [];
        for (var j = 0; j < all.length; j++) {
            var parsed = parseEntry(all[j]);
            if (parsed.id !== currentId) others.push(parsed);
        }
        if (others.length === 0) return null;
        var index = Math.floor(Math.random() * others.length);
        var parsed = others[index];
        return { url: toWatchUrl(parsed.id, parsed.startAt), startAt: parsed.startAt };
    }

    /**
     * Public API.
     */
    global.SeasonVideo = {
        VIDEO_GROUPS: VIDEO_GROUPS,
        getDateInNewYork: getDateInNewYork,
        getSeason: function() {
            var d = getDateInNewYork();
            return getSeason(d.month, d.day);
        },
        getVideoUrl: getVideoUrl,
        getRandomVideoUrl: getRandomVideoUrl,
        getAnotherVideoUrl: getAnotherVideoUrl
    };
})(typeof window !== "undefined" ? window : this);
