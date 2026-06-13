const cheerio = require("cheerio");
const superagent = require("superagent");
class BaseSpider {
    constructor(cookie) {
        this.cheerio = cheerio;
        this.superagent = superagent;
        // 爬取节点
        this.ENDPOINT = {
            BOOK: "https://book.douban.com/subject/",
            MOVIE: "https://movie.douban.com/subject/",
            MUSIC: "https://music.douban.com/subject/",
        };
        // 用户传入的cookie
        this.cookie = cookie || "";
        this.fallbackImages = {
            book: "https://images.weserv.nl/?url=https://img1.doubanio.com/view/subject/s/public/s33309978.jpg",
            movie: "https://images.weserv.nl/?url=https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2221768894.webp",
            music: "https://images.weserv.nl/?url=https://img3.doubanio.com/view/subject/m/public/s32295462.jpg",
        };
    }
    /**
     * 爬取内容,评价等
     * @param {number} subjectId 书籍的id
     */
    crawl(subjectId) {}
    /**
     * 解析文本数据
     * @param {string} plainText
     */
    parsePlainText(plainText) {}
    fallbackCard(type, subjectId, err) {
        const endpoint = this.ENDPOINT[type.toUpperCase()];
        const status = err && err.status ? err.status : "unknown";
        const reason = status === 403
            ? "豆瓣拒绝了构建环境的访问"
            : "豆瓣卡片暂时无法获取详情";

        return {
            url: endpoint + subjectId,
            title: `${reason}，点击查看原页面`,
            author: "-",
            director: "-",
            actors: "-",
            publishDate: "-",
            genre: "-",
            rate: "-",
            img: this.fallbackImages[type],
        };
    }
}
module.exports.BaseSpider = BaseSpider;
