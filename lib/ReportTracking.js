function onImpressionTracking(transaction) {
  var report = transaction.adReport
  report.impression += 1

  var trackingInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  trackingInfo.ip = transaction.ip
  trackingInfo.name = transaction.name
  trackingInfo.type = "IMPRESSION"

  if (report.userActions) {
    report.userActions.push(trackingInfo)
  } else {
    report.userActions = [trackingInfo]
  }

  return getAssetRegistry('org.vela.adReport.AdReport')
    .then(function (assetRegistry) {
      return assetRegistry.update(report)
    })
    .then(function () {
      sendEvent("Detect impression");
    })
}

function onClickTracking(transaction) {
  var report = transaction.adReport
  report.click += 1

  var trackingInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  trackingInfo.ip = transaction.ip
  trackingInfo.name = transaction.name
  trackingInfo.type = "CLICK"

  if (report.userActions) {
    report.userActions.push(trackingInfo)
  } else {
    report.userActions = [trackingInfo]
  }

  return getAssetRegistry('org.vela.adReport.AdReport')
    .then(function (assetRegistry) {
      return assetRegistry.update(report)
    })
    .then(function () {
      sendEvent("Detect click");
    })
}

function onConversionTracking(transaction) {
  var report = transaction.adReport
  report.cv += 1

  var trackingInfo = getFactory().newConcept('org.vela.adReport', 'UserInfo')
  trackingInfo.ip = transaction.ip
  trackingInfo.name = transaction.name
  trackingInfo.type = "CV"

  if (report.userActions) {
    report.userActions.push(trackingInfo)
  } else {
    report.userActions = [trackingInfo]
  }

  return getAssetRegistry('org.vela.adReport.AdReport')
    .then(function (assetRegistry) {
      return assetRegistry.update(report)
    })
    .then(function () {
      sendEvent("Detect conversion");
    })
}