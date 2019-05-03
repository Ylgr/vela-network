function validateAmount(amount) {
    if (amount < 0) {
        throw new Error('Invalid amount')
    }
}

function sendEvent(msg) {
    var gasEvent = getFactory().newEvent('org.vela.gas', 'TransactionCompleted')
    gasEvent.msg = msg
    emit(gasEvent)
}

function onDepositGas(transaction) {
    validateAmount(transaction.amount)

    var gas = transaction.gas
    gas.amount += transaction.amount

    var newTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    newTransaction.amount = transaction.amount
    newTransaction.type = "DEPOSIT"

    if (gas.transactions) {
        gas.transactions.push(newTransaction)
    } else {
        gas.transactions = [newTransaction]
    }

    return getAssetRegistry('org.vela.gas.Gas')
        .then(function (assetRegistry) {
            return assetRegistry.update(gas)
        })
        .then(function () {
            sendEvent("Transfer complete");
        })
}

function onWithdrawGas(transaction) {
    validateAmount(transaction.amount)

    var gas = transaction.gas

    if (gas.amount < transaction.amount) {
        throw new Error('Insufficient fund')
    }

    gas.amount -= transaction.amount

    var newTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    newTransaction.amount = - transaction.amount
    newTransaction.type = "WITHDRAW"

    if (gas.transactions) {
        gas.transactions.push(newTransaction)
    } else {
        gas.transactions = [newTransaction]
    }

    return getAssetRegistry('org.vela.gas.Gas')
        .then(function (assetRegistry) {
            return assetRegistry.update(gas)
        })
        .then(function () {
            sendEvent("Transfer complete");
        })
}

function onTransferGas(transaction) {
    validateAmount(transaction.amount)

    if (transaction.sender.amount < transaction.amount) {
        throw new Error('Insufficient fund')
    }

    transaction.sender.amount -= transaction.amount
    transaction.receiver.amount += transaction.amount

    var sendTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    sendTransaction.amount = - transaction.amount
    sendTransaction.type = "SEND"
    if (transaction.sender.transactions) {
        transaction.sender.transactions.push(sendTransaction)
    } else {
        transaction.sender.transactions = [sendTransaction]
    }
    var receiveTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    receiveTransaction.amount = transaction.amount
    receiveTransaction.type = "RECEIVE"
    if (transaction.receiver.transactions) {
        transaction.receiver.transactions.push(receiveTransaction)
    } else {
        transaction.receiver.transactions = [receiveTransaction]
    }
    return getAssetRegistry('org.vela.gas.Gas')
        .then(function (assetRegistry) {
            return assetRegistry.updateAll([transaction.sender, transaction.receiver])
        })
        .then(function () {
            sendEvent("Transfer complete")
        })
}

async function onChangeAdStatus(adUpdated) {
  	console.log("change ad status")
  	adUpdated.adReport.isActive = adUpdated.isActive;
  	const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(adUpdated.adReport);
}

async function onClickTracking(trackingInfo) {
    console.log("tracking click")
  	validateAmount(trackingInfo.paymentWallet.amount - 1)
  	const gasConsuming = 1;
  
  	var userInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  	userInfo.type = "CLICK";
  	userInfo.name = trackingInfo.viewer.name;
	if (trackingInfo.ad.userActions) {
        trackingInfo.ad.userActions.push(userInfo);
    } else {
        trackingInfo.ad.userActions = [userInfo];
    }  
  	trackingInfo.ad.click = trackingInfo.ad.click + 1;
  	const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(trackingInfo.ad);
  
  	var paymentUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    paymentUpdate.amount = - gasConsuming;
    paymentUpdate.type = "PAY";
  	if (trackingInfo.paymentWallet.transactions) {
        trackingInfo.paymentWallet.transactions.push(paymentUpdate);
    } else {
        trackingInfo.paymentWallet.transactions = [paymentUpdate];
    }
  	trackingInfo.paymentWallet.amount = trackingInfo.paymentWallet.amount - gasConsuming;
  	const wallets = await getAssetRegistry('org.vela.gas.Gas');
  	await wallets.update(trackingInfo.paymentWallet);
  
  	const rewardGas = gasConsuming*2/10;
    var rewardUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    rewardUpdate.amount = rewardGas;
    rewardUpdate.type = "REWARD_CLICK";
  	if (trackingInfo.rewardWallet.transactions) {
        trackingInfo.rewardWallet.transactions.push(rewardUpdate);
    } else {
        trackingInfo.rewardWallet.transactions = [rewardUpdate];
    }
  	trackingInfo.rewardWallet.amount = trackingInfo.rewardWallet.amount + rewardGas;
  	await wallets.update(trackingInfo.rewardWallet);
  
  	const recommendGas = gasConsuming*6/10;
  	var recommendUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction');
    recommendUpdate.amount = recommendGas;
    recommendUpdate.type = "REWARD_RECOMMEND";
    if (trackingInfo.publishWallet.transactions) {
        trackingInfo.publishWallet.transactions.push(recommendUpdate);
    } else {
        trackingInfo.publishWallet.transactions = [recommendUpdate];
    }
  	trackingInfo.publishWallet.amount = trackingInfo.publishWallet.amount + recommendGas;
  	await wallets.update(trackingInfo.publishWallet);
  
  	const burnGas = gasConsuming*2/10;
  	var burnUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction');
    burnUpdate.amount = burnGas;
    burnUpdate.type = "BURN";
  	const burnWallet = await wallets.get('0x00');
    if (burnWallet.transactions) {
        burnWallet.transactions.push(burnUpdate);
    } else {
        burnWallet.transactions = [burnUpdate];
    }
  	burnWallet.amount = burnWallet.amount + burnGas;
  	await wallets.update(burnWallet);
}

async function onViewTracking(trackingInfo) {
    console.log("tracking view")
  	validateAmount(trackingInfo.paymentWallet.amount - 1)
  	const gasConsuming = 0.02;
  
  	var userInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  	userInfo.type = "VIEW";
  	userInfo.name = trackingInfo.viewer.name;
	if (trackingInfo.ad.userActions) {
        trackingInfo.ad.userActions.push(userInfo);
    } else {
        trackingInfo.ad.userActions = [userInfo];
    }  
  	trackingInfo.ad.view = trackingInfo.ad.view + 1;
  	const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(trackingInfo.ad);
  
  	var paymentUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    paymentUpdate.amount = - gasConsuming;
    paymentUpdate.type = "PAY";
  	if (trackingInfo.paymentWallet.transactions) {
        trackingInfo.paymentWallet.transactions.push(paymentUpdate);
    } else {
        trackingInfo.paymentWallet.transactions = [paymentUpdate];
    }
  	trackingInfo.paymentWallet.amount = trackingInfo.paymentWallet.amount - gasConsuming;
  	const wallets = await getAssetRegistry('org.vela.gas.Gas');
  	await wallets.update(trackingInfo.paymentWallet);
  
  	const rewardGas = gasConsuming/10;
    var rewardUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    rewardUpdate.amount = rewardGas;
    rewardUpdate.type = "REWARD";
  	if (trackingInfo.rewardWallet.transactions) {
        trackingInfo.rewardWallet.transactions.push(rewardUpdate);
    } else {
        trackingInfo.rewardWallet.transactions = [rewardUpdate];
    }
  	trackingInfo.rewardWallet.amount = trackingInfo.rewardWallet.amount + rewardGas;
  	await wallets.update(trackingInfo.rewardWallet);
  
  	const backGas = gasConsuming*6/10;
  	var backUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction');
    backUpdate.amount = backGas;
    backUpdate.type = "BACK";
  	const adminWallet = await wallets.get('vela-admin');
    if (adminWallet.transactions) {
        adminWallet.transactions.push(backUpdate);
    } else {
        adminWallet.transactions = [backUpdate];
    }
  	adminWallet.amount = adminWallet.amount + backGas;
  	await wallets.update(adminWallet);
  
  	const burnGas = gasConsuming*3/10;
  	var burnUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction');
    burnUpdate.amount = burnGas;
    burnUpdate.type = "BURN";
  	const burnWallet = await wallets.get('0x00');
    if (burnWallet.transactions) {
        burnWallet.transactions.push(burnUpdate);
    } else {
        burnWallet.transactions = [burnUpdate];
    }
  	burnWallet.amount = burnWallet.amount + burnGas;
  	await wallets.update(burnWallet);
}

async function onAddReport(info){
	console.log("add report")
	if(info.wallet.reports) {
      info.wallet.reports.push(info.report)
    } else {
      info.wallet.reports = [info.report]
    }
  	const wallet = await getAssetRegistry('org.vela.gas.Gas');
  	await wallet.update(info.wallet);
}

async function onUpdateAd(info){
	console.log("Update ad")
	info.ad.name = info.name
  	info.ad.data = info.data
  	info.ad.url = info.url
    info.ad.contents = info.contents
	info.ad.category = info.category
    const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(info.ad);
}