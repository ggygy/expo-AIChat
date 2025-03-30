module.exports = {
    sign: () => { throw new Error("jsonwebtoken.sign 不支持在 Expo 中使用"); },
    verify: () => { throw new Error("jsonwebtoken.verify 不支持在 Expo 中使用"); },
    decode: () => { throw new Error("jsonwebtoken.decode 不支持在 Expo 中使用"); },
};