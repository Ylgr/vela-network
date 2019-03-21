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

function onUsingGas(transaction) {
    validateAmount(transaction.amount)

    if (transaction.advertiser.amount < transaction.amount) {
        throw new Error('Insufficient fund')
    }

    transaction.advertiser.amount -= transaction.amount
    transaction.publisher.amount += transaction.amount * 4 / 5
    transaction.user.amount += transaction.amount / 5

    var usingTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    usingTransaction.amount = - transaction.amount
    usingTransaction.type = "USING"
    if (transaction.advertiser.transactions) {
        transaction.advertiser.transactions.push(usingTransaction)
    } else {
        transaction.advertiser.transactions = [usingTransaction]
    }

    var backTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    backTransaction.amount = transaction.amount * 4 / 5
    backTransaction.type = "BACK"
    if (transaction.publisher.transactions) {
        transaction.publisher.transactions.push(backTransaction)
    } else {
        transaction.publisher.transactions = [backTransaction]
    }

    var rewardTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    rewardTransaction.amount = transaction.amount / 5
    rewardTransaction.type = "REWARD"
    if (transaction.user.transactions) {
        transaction.user.transactions.push(rewardTransaction)
    } else {
        transaction.user.transactions = [rewardTransaction]
    }

    return getAssetRegistry('org.vela.gas.Gas')
        .then(function (assetRegistry) {
            return assetRegistry.updateAll([transaction.advertiser, transaction.publisher, transaction.user])
        })
        .then(function () {
            sendEvent("Using gas complete")
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
  
  	var userInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  	userInfo.type = "CLICK";
  	userInfo.ip = "127.0.0.1";
  	userInfo.name = "no name";
	if (trackingInfo.ad.userActions) {
        trackingInfo.ad.userActions.push(userInfo);
    } else {
        trackingInfo.ad.userActions = [userInfo];
    }  
  	trackingInfo.ad.click = trackingInfo.ad.click + 1;
  	const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(trackingInfo.ad);
  
  	var paymentUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    paymentUpdate.amount = -1
    paymentUpdate.type = "USING"
  	if (trackingInfo.paymentWallet.transactions) {
        trackingInfo.paymentWallet.transactions.push(paymentUpdate);
    } else {
        trackingInfo.paymentWallet.transactions = [paymentUpdate];
    }
  	trackingInfo.paymentWallet.amount = trackingInfo.paymentWallet.amount - 1;
  	const wallets = await getAssetRegistry('org.vela.gas.Gas');
  	await wallets.update(trackingInfo.paymentWallet);
  
    var rewardUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    rewardUpdate.amount = 0.1
    rewardUpdate.type = "REWARD"
  	if (trackingInfo.rewardWallet.transactions) {
        trackingInfo.rewardWallet.transactions.push(rewardUpdate);
    } else {
        trackingInfo.rewardWallet.transactions = [rewardUpdate];
    }
  	trackingInfo.rewardWallet.amount = trackingInfo.rewardWallet.amount + 0.1;
  	await wallets.update(trackingInfo.rewardWallet);
  
  	var backUpdate = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    backUpdate.amount = 0.6
    backUpdate.type = "REWARD"
}

function onImpressionTracking(trackingInfo) {}

function onConversionTracking(trackingInfo) {}

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
    const ad = await getAssetRegistry('org.vela.adReport.AdReport');
  	await ad.update(info.ad);
}