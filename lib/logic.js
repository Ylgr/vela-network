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
    newTransaction.amount = transaction.amount
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
    sendTransaction.amount = transaction.amount
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
  
  function onUsingGas(transaction){
    validateAmount(transaction.amount)
    
    if (transaction.advertiser.amount < transaction.amount) {
      throw new Error('Insufficient fund')
    }
    
    transaction.advertiser.amount -= transaction.amount
    transaction.publisher.amount += transaction.amount*4/5
    transaction.user.amount += transaction.amount/5
    
    var usingTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    usingTransaction.amount = transaction.amount
    usingTransaction.type = "USING"
    if (transaction.advertiser.transactions) {
      transaction.advertiser.transactions.push(usingTransaction)
    } else {
      transaction.advertiser.transactions = [usingTransaction]
    }
    
    var backTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    backTransaction.amount = transaction.amount*4/5
    backTransaction.type = "BACK"
    if (transaction.publisher.transactions) {
      transaction.publisher.transactions.push(backTransaction)
    } else {
      transaction.publisher.transactions = [backTransaction]
    }
    
    var rewardTransaction = getFactory().newConcept('org.vela.gas', 'GasTransaction')
    rewardTransaction.amount = transaction.amount/5
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