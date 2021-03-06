const app = getApp()
const util = require('../../utils/util.js')

Page({
	data: {
		fromShare: 0,
		config: {},
		card: {},
		showPanel: false
	},
	onLoad: function (options) {
		this.setData({
			version: app.globalData.version
		})
		var that = this
		if (app.globalData.config) {
			this.setData({
				config: app.globalData.config
			})
		} else {
			wx.cloud.callFunction({
				name: 'updateConfig',
				success: function (res) {
          // console.log('cloudres')
					that.setData({
						config: res.result
          })
          app.globalData.config = res.result
				}
			})
		}

		this.setData({
			fromShare: options.fromShare
		})
		if (options.card) {
			let cardStr = decodeURIComponent(options.card)
			this.setData({
				card: JSON.parse(cardStr)
			})
			console.log(this.data.config.cardSet[this.data.card.cardSet])
			if(!this.data.config.cardSet[this.data.card.cardSet]){
				wx.cloud.callFunction({
					name: 'refreshCardSets',
					success: function (res) {
						console.log(res)
						that.setData({
							config: res.result,
							card: JSON.parse(cardStr)
						})
						app.globalData.config = res.result
					}
				})
			}
		} else {
			let params = {
				keywords: options.name,
				cost: options.cost,
				cardClass: options.cardclass
			}
			util.GET('action/cards/query', params, function (res) {
				console.log(res)
				that.setData({
					card: res.data.cards[0]
				})
				console.log(this.data.config.cardSet[this.data.card.cardSet])
				if(!this.data.config.cardSet[this.data.card.cardSet]){
					wx.cloud.callFunction({
						name: 'refreshCardSets',
						success: function (res) {
							that.setData({
								config: res.result,
								card: res.data.cards[0]
							})
							app.globalData.config = res.result
						}
					})
				}
			})
		}
	},
	back2Index: function () {
		if (this.data.fromShare != 0) {
			wx.reLaunch({
				url: '/pages/index/index'
			})
		} else {
			wx.navigateBack({
				delta: 1
			})
		}
	},
	onShareAppMessage: function (res) {
    let config = this.data.config
		let card = this.data.card
    let cardStr = JSON.stringify(card)
    let cardStrEncode = encodeURIComponent(cardStr)
		return {
      title: `${card.name} - ${config.cardClass[card.cardClass]}${config.cardType[card.cardType]}`,
      path: `pages/details/details?fromShare=1&card=${cardStrEncode}`,
			imageUrl: card.imageUrl
		}
	},
	share2Moment: function () {
		this.setData({
			showPanel: true
		})
		let card = this.data.card
		let that = this
		wx.showToast({
			title: '正在生成图片',
			icon: 'loading',
      duration: 10000
		})
		wx.cloud.callFunction({
			name: 'getPageCode',
			data: {
				cardID: card.cardId,
				cardImageUrl: card.imageUrl,
				pagePath: `pages/details/details?fromShare=2&name=${card.name}&cost=${card.cost}&cardclass=${card.cardClass}`
			},
			success: function (res) {
				const cloudFRes = res
				console.log(res)
				let that1 = that
				wx.getImageInfo({
					src: cloudFRes.result.wxacode,
					success: function (res) {
						// console.log(res)
						const showctx = wx.createCanvasContext('showCanvas')
						const sharectx = wx.createCanvasContext('shareCanvas')
						// ctx.scale(0.5, 0.5)
						// ctx.translate(-200, -360)
						showctx.setFillStyle('#293C5A')
						showctx.fillRect(0, 0, 200, 360)
            showctx.setFillStyle('#fff')
            showctx.fillRect(0, 270, 200, 90)
            showctx.setStrokeStyle('#293C5A')
            showctx.strokeRect(0, 0, 200, 360)
						showctx.drawImage(res.path, 20, 275, 80, 80)
            showctx.setFillStyle('#151A27')
						showctx.setFontSize(12)
						showctx.fillText('炉石卡牌集', 110, 300)
            showctx.setFillStyle('#0E86CA')
						showctx.setFontSize(9)
						showctx.fillText('长按识别小程序码', 110, 315)
						showctx.fillText('查看卡牌详情', 110, 328)

						sharectx.setFillStyle('#293C5A')
            sharectx.fillRect(0, 0, 200 * 4, 360 * 4)
            sharectx.setFillStyle('#fff')
            sharectx.fillRect(0, 270 * 4, 200 * 4, 90 * 4)
            sharectx.setStrokeStyle('#293C5A')
            sharectx.strokeRect(0, 0, 200 * 4, 360 * 4)
						sharectx.drawImage(res.path, 20 * 4, 275 * 4, 80 * 4, 80 * 4)
            sharectx.setFillStyle('#151A27')
						sharectx.setFontSize(12 * 4)
						sharectx.fillText('炉石卡牌集', 110 * 4, 300 * 4)
            sharectx.setFillStyle('#0E86CA')
						sharectx.setFontSize(9 * 4)
						sharectx.fillText('长按识别小程序码', 110 * 4, 315 * 4)
						sharectx.fillText('查看卡牌详情', 110 * 4, 328 * 4)
            
						wx.getImageInfo({
							src: cloudFRes.result.image,
							success: function (res) {
								// console.log(res)
								showctx.drawImage(res.path, 10, 10, 180, 255)
                showctx.draw(false, function(e){
                  wx.hideToast()
                })

								sharectx.drawImage(res.path, 10 * 4, 10 * 4, 180 * 4, 255 * 4)
                sharectx.draw()
							}
						})
					}
				})
			}
		})
	},
	closePanel: function () {
		this.setData({
			showPanel: false
		})
	},
	saveImg: function () {
		wx.canvasToTempFilePath({
			canvasId: 'shareCanvas',
			fileType: 'jpg',
			quality: 1,
			success: function (res) {
				wx.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success: function (res) {
						wx.showToast({
							title: '已保存',
						})
					}
				})
			}
		}, this)
	},
	share2Friends: function(){
		wx.showShareMenu({
			withShareTicket: true
		})
	},
  touchMove: function () { },
  navToGeizan: function () {
    wx.navigateToMiniProgram({
      appId: 'wx18a2ac992306a5a4',
      path: 'pages/apps/largess/detail?id=sdwAemIH4SM%3D'
    })
  }
})