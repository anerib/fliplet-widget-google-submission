var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData(widgetId) || {};
var appName = '';
var organizationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = [];
var appStoreSubmission = {};
var enterpriseSubmission = {};
var notificationSettings = {};
var appInfo;
var statusTableTemplate = $('#status-table-template').html();
var $statusAppStoreTableElement = $('.app-build-appstore-status-holder');
var $statusEnterpriseTableElement = $('.app-build-enterprise-status-holder');
var initLoad;
var userInfo;
var hasFolders = false;
var screenShotsMobile = [];
var screenShotsTablet = [];
var haveScreenshots = false;
var screenshotValidationNotRequired = false;

/* FUNCTIONS */
String.prototype.toCamelCase = function() {
  return this.replace(/^([A-Z])|[^A-Za-z]+(\w)/g, function(match, p1, p2, offset) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  }).replace(/([^A-Z-a-z])/g, '').toLowerCase();
};

var createBundleID = function(orgName, appName) {
  return $.ajax({
    url: "https://itunes.apple.com/lookup?bundleId=com." + orgName + "." + appName,
    dataType: "jsonp"
  });
};

function incrementVersionNumber(versionNumber) {
  var splitNumber = versionNumber.split('.');
  var arrLength = splitNumber.length;

  while (arrLength--) {
    if (splitNumber[arrLength] < 99) {
      splitNumber[arrLength] = parseInt(splitNumber[arrLength], 10) + 1;
      break;
    }
  }

  return splitNumber.join('.');
}

function incrementVersionCode(versionNumber) {
  var newVersionNumber = incrementVersionNumber(versionNumber);
  var splitNumber = newVersionNumber.split('.');
  var newVersionCode = splitNumber.join('') + '0';

  return newVersionCode;
}

function checkHasScreenshots() {
  haveScreenshots = hasFolders && screenShotsMobile.length && screenShotsTablet.length;
}

function addThumb(thumb) {
  var template = Fliplet.Widget.Templates['templates.thumbs'];
  return template(thumb);
}

function loadAppStoreData() {

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* APP SCREENSHOTS */
    if (name === "fl-store-screenshots") {
      if (appStoreSubmission.data[name]) {
        $('[name="' + name + '"][value="' + appStoreSubmission.data[name] + '"]').prop('checked', true).trigger('change');
        screenshotValidationNotRequired = appStoreSubmission.data[name] === 'existing'
      } else {
        $('[name="' + name + '"][value="new"]').prop('checked', true).trigger('change');
      }
      return;
    }

    /* FEATURED GRAPHIC */
    if (name === "fl-store-featuredGraphic") {
      $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name][0].name : '');
      return;
    }

    /* NOTIFICATION ICON */
    if (name === "fl-store-notificationIcon") {
      if (appStoreSubmission.data[name]) {
        $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name][0].name : '');
      }
      return;
    }

    /* ADD BUNDLE ID */
    if (name === "fl-store-bundleId" && typeof appStoreSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ast-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ast-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-store-bundleId" && typeof appStoreSubmission.data[name] !== "undefined") {
      $('.bundleId-ast-text').html(appStoreSubmission.data[name]);
      $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      return;
    }
    if (name === "fl-store-versionNumber") {
      if (typeof appStoreSubmission.data[name] !== 'undefined' && appStoreSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      } else if (typeof appStoreSubmission.previousResults !== 'undefined' && typeof appStoreSubmission.previousResults.versionNumber !== 'undefined' && appStoreSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }
      return;
    }
    if (name === "fl-store-versionCode") {
      if (typeof appStoreSubmission.data[name] !== 'undefined' && appStoreSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      } else if (typeof appStoreSubmission.previousResults !== 'undefined' && typeof appStoreSubmission.previousResults.versionCode !== 'undefined' && appStoreSubmission.previousResults.versionCode !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.previousResults.versionCode);
      } else {
        $('[name="' + name + '"]').val('1000');
      }
      return;
    }

    $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '');
  });

  if (appIcon && ((hasFolders && screenShotsMobile.length && screenShotsTablet.length) || screenshotValidationNotRequired)) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    $('.app-details-appStore .app-screenshots').removeClass('has-error');

    allAppData.push('appStore');
  } else {
    $('.app-details-appStore').addClass('required-fill');

    if (!appIcon) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }
    if (hasFolders) {
      if (screenShotsMobile.length == 0 || screenShotsTablet.length == 0) {
        $('.app-details-appStore .app-screenshots').addClass('has-error');
      }
    } else {
      $('.app-details-appStore .app-screenshots').addClass('has-error');
    }
  }
}

function loadEnterpriseData() {

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-ent-bundleId" && typeof enterpriseSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ent-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ent-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-ent-bundleId" && typeof enterpriseSubmission.data[name] !== "undefined") {
      $('.bundleId-ent-text').html(enterpriseSubmission.data[name]);
      $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
      return;
    }
    /* NOTIFICATION ICON */
    if (name === "fl-ent-notificationIcon") {
      if (enterpriseSubmission.data[name]) {
        $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof enterpriseSubmission.data[name] !== "undefined") ? enterpriseSubmission.data[name][0].name : '');
      }
      return;
    }
    if (name === "fl-ent-versionNumber") {
      if (typeof enterpriseSubmission.data[name] !== 'undefined' && enterpriseSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
      } else if (typeof enterpriseSubmission.previousResults !== 'undefined' && typeof enterpriseSubmission.previousResults.versionNumber !== 'undefined' && enterpriseSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }
      return;
    }
    if (name === "fl-ent-versionCode") {
      if (typeof enterpriseSubmission.data[name] !== 'undefined' && enterpriseSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
      } else if (typeof enterpriseSubmission.previousResults !== 'undefined' && typeof enterpriseSubmission.previousResults.versionCode !== 'undefined' && enterpriseSubmission.previousResults.versionCode !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.previousResults.versionCode);
      } else {
        $('[name="' + name + '"]').val('1000');
      }
      return;
    }

    $('[name="' + name + '"]').val((typeof enterpriseSubmission.data[name] !== "undefined") ? enterpriseSubmission.data[name] : '');
  });

  if (appIcon) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }

    allAppData.push('enterprise');
  } else {
    $('.app-details-ent').addClass('required-fill');

    if (!appIcon) {
      $('.app-details-ent .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }
  }
}

function loadPushNotesData() {
  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADDING NOTIFICATIONS SETTINGS */
    if (name === 'fl-push-senderId') {
      $('[name="' + name + '"]').val(notificationSettings.gcmSenderId || '');
      return;
    }
    if (name === 'fl-push-serverKey') {
      $('[name="' + name + '"]').val(notificationSettings.gcmServerKey || '');
      return;
    }
  });
}

function submissionBuild(appSubmission, origin) {
  Fliplet.App.Submissions.build(appSubmission.id).then(function(builtSubmission) {

    if (origin === "appStore") {
      appStoreSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(appStoreSubmission.data['fl-store-versionNumber']);
      $('[name="fl-store-versionNumber"]').val(newVersionNumber);
      var newVersionCode = incrementVersionCode(appStoreSubmission.data['fl-store-versionNumber']);
      $('[name="fl-store-versionCode"]').val(newVersionCode);
      saveAppStoreData();
    }

    if (origin === "enterprise") {
      enterpriseSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(enterpriseSubmission.data['fl-ent-versionNumber']);
      $('[name="fl-ent-versionNumber"]').val(newVersionNumber);
      var newVersionCode = incrementVersionCode(enterpriseSubmission.data['fl-ent-versionNumber']);
      $('[name="fl-ent-versionCode"]').val(newVersionCode);
      saveEnterpriseData();
    }

    Fliplet.Studio.emit('refresh-app-submissions');

    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    $('.save-' + origin + '-request').addClass('saved').hide().fadeIn(250);

    clearTimeout(initLoad);
    initialLoad(false, 0);

    Fliplet.Widget.autosize();

    setTimeout(function() {
      $('.save-' + origin + '-request').fadeOut(250, function() {
        $('.save-' + origin + '-request').removeClass('saved');
        Fliplet.Widget.autosize();
      });
    }, 10000);
  }, function(err) {
    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    alert(err.responseJSON.message);
  });
}

function save(origin, submission) {
  Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
            platform: 'android',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function(newSubmission) {
            if (origin === "appStore") {
              appStoreSubmission = newSubmission;
            }
            if (origin === "enterprise") {
              enterpriseSubmission = newSubmission;
            }

            Fliplet.App.Submissions.update(newSubmission.id, newSubmission.data).then(function() {
              $('.save-' + origin + '-progress').addClass('saved').hide().fadeIn(250);
              Fliplet.Widget.autosize();

              setTimeout(function() {
                $('.save-' + origin + '-progress').fadeOut(250, function() {
                  $('.save-' + origin + '-progress').removeClass('saved');
                  Fliplet.Widget.autosize();
                });
              }, 4000);
            });
          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        $('.save-' + origin + '-progress').addClass('saved').hide().fadeIn(250);
        Fliplet.Widget.autosize();

        setTimeout(function() {
          $('.save-' + origin + '-progress').fadeOut(250, function() {
            $('.save-' + origin + '-progress').removeClass('saved');
            Fliplet.Widget.autosize();
          });
        }, 4000);
      });
    })
    .catch(function(err) {
      alert(err.responseJSON.message);
    });
}

function requestBuild(origin, submission) {
  $('.button-' + origin + '-request').html('Requesting <i class="fa fa-spinner fa-pulse fa-fw"></i>');

  if (origin === 'appStore') {
    submission.data.folderStructure = appSettings.folderStructure;
  }

  var defaultSplashScreenData = {
    "url": $('[data-' + origin.toLowerCase() + '-default-splash-url]').data(origin.toLowerCase() + '-default-splash-url')
  };

  submission.data.splashScreen = appSettings.splashScreen ? appSettings.splashScreen : defaultSplashScreenData;
  submission.data.appIcon = appIcon;
  submission.data.legacyBuild = appSettings.legacyBuild || false;

  Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
            platform: 'android',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function(newSubmission) {
            if (origin === "appStore") {
              appStoreSubmission = newSubmission;
            }
            if (origin === "enterprise") {
              enterpriseSubmission = newSubmission;
            }

            submissionBuild(newSubmission, origin);

          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        submissionBuild(submission, origin);
      });
    })
    .catch(function(err) {
      $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
      alert(err.responseJSON.message);
    });
}

function saveAppStoreData(request) {
  var data = appStoreSubmission.data;
  var pushData = notificationSettings;
  var uploadFilePromise = Promise.resolve();

  $('#appStoreConfiguration [name]').each(function(idx, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === 'fl-store-bundleId') {
      pushData.gcmPackageName = value;
      data[name] = value;
      return;
    }

    if ($(el).attr('type') === "file") {
      var fileList = el.files;
      var file = new FormData();

      if (fileList.length > 0) {
        for (var i = 0; i < fileList.length; i++) {
          file.append(name, fileList[i]);
        }

        uploadFilePromise = Fliplet.Media.Files.upload({
          data: file,
          appId: Fliplet.Env.get('appId')
        }).then(function(files) {
          data[name] = files;
          return Promise.resolve();
        });
      }
      return;
    }

    data[name] = value;
  });

  uploadFilePromise.then(function() {
    appStoreSubmission.data = data;
    notificationSettings = pushData;

    if (request) {
      requestBuild('appStore', appStoreSubmission);
    } else {
      save('appStore', appStoreSubmission);
    }
  });
}

function saveEnterpriseData(request) {
  var data = enterpriseSubmission.data;
  var uploadFilePromise = Promise.resolve();

  $('#enterpriseConfiguration [name]').each(function(idx, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if ($(el).attr('type') === "file") {
      var fileList = el.files;
      var file = new FormData();

      if (fileList.length > 0) {
        for (var i = 0; i < fileList.length; i++) {
          file.append(name, fileList[i]);
        }

        uploadFilePromise = Fliplet.Media.Files.upload({
          data: file,
          appId: Fliplet.Env.get('appId')
        }).then(function(files) {
          data[name] = files;
          return Promise.resolve();
        });
      }
      return;
    }

    data[name] = value;
  });

  uploadFilePromise.then(function() {
    enterpriseSubmission.data = data;

    if (request) {
      requestBuild('enterprise', enterpriseSubmission);
    } else {
      save('enterprise', enterpriseSubmission);
    }
  });
}

function savePushData() {
  var data = notificationSettings;

  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === 'fl-push-senderId') {
      data.gcmSenderId = value;
      return;
    }
    if (name === 'fl-push-serverKey') {
      data.gcmServerKey = value;
      return;
    }
  });

  data.gcm = !!((data.gcmSenderId && data.gcmSenderId !== '') && (data.gcmServerKey && data.gcmServerKey !== '') && (data.gcmPackageName && data.gcmPackageName !== ''));

  notificationSettings = data;

  Fliplet.API.request({
    method: 'PUT',
    url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
    data: notificationSettings
  }).then(function() {
    $('.save-push-progress').addClass('saved');
    if (!notificationSettings.gcm) {
      alert('If using Signed APK, you will need to fill in the Bundle ID field and request an app.');
    }

    setTimeout(function() {
      $('.save-push-progress').removeClass('saved');
    }, 4000);
  });
}

function init() {
  Fliplet.Apps.get().then(function(apps) {
    appInfo = _.find(apps, function(app) {
      return app.id === Fliplet.Env.get('appId');
    });
  });

  $('#fl-store-keywords').tokenfield();

  /* APP ICON */
  if (appIcon) {
    $('.setting-app-icon.userUploaded').attr('src', appIcon);
    $('.setting-app-icon.userUploaded').removeClass('hidden');
    $('.setting-app-icon.default').addClass('hidden');
  }

  /* APP SPLASH SCREEN */
  if (appSettings.splashScreen) {
    $('.setting-splash-screen.userUploaded').css('background-image', 'url(' + appSettings.splashScreen.url + ')');
    $('.setting-splash-screen.userUploaded').removeClass('hidden');
    $('.setting-splash-screen.default').addClass('hidden');
  }

  loadAppStoreData();
  loadEnterpriseData();
  loadPushNotesData();
  Fliplet.Widget.autosize();
}

/* AUX FUNCTIONS */
function checkGroupErrors() {
  $('.has-error').each(function(i, el) {
    $(el).parents('.panel-default').addClass('required-fill');
  });

  $('.panel-default').each(function(i, el) {
    var withError = $(el).find('.has-error').length;

    if (withError === 0) {
      $(el).not('.app-details-appStore, .app-details-ent, .app-details-ent').removeClass('required-fill');
    }
  });
}

/* ATTACH LISTENERS */
$('[name="fl-store-screenshots"]').on('change', function() {
  var value = $(this).val();
  var id = $(this).attr('id');
  checkHasScreenshots();

  if (value === 'new' && !haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').addClass('show');

    $('[data-item="fl-store-screenshots-new"]').removeClass('show');
    $('[data-item="fl-store-screenshots-existing"]').removeClass('show');
  }
  if (value === 'new' && haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').removeClass('show');
    $('[data-item="fl-store-screenshots-new"]').addClass('show');

    $('[data-item="fl-store-screenshots-existing"]').removeClass('show');

    
    _.take(screenShotsMobile, 4).forEach(function(thumb) {
      $('.mobile-thumbs').append(addThumb(thumb));
    });

    _.take(screenShotsTablet, 4).forEach(function(thumb) {
      $('.tablet-thumbs').append(addThumb(thumb));
    });
  }
  if (value === 'existing') {
    $('.app-details-appStore .app-screenshots').removeClass('has-error');
    $('[data-item="fl-store-screenshots-existing"]').addClass('show');

    $('[data-item="fl-store-screenshots-new-warning"]').removeClass('show');
    $('[data-item="fl-store-screenshots-new"]').removeClass('show');
  }
});

$('[name="submissionType"]').on('change', function() {
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');

  Fliplet.Widget.autosize();
});

$('.fl-sb-appStore [change-bundleid], .fl-sb-fliplet-signed [change-bundleid]').on('click', function() {
  var changeBundleId = confirm("Are you sure you want to change the unique Bundle ID?");

  if (changeBundleId) {
    $('.fl-bundleId-holder').addClass('hidden');
    $('.fl-bundleId-field').addClass('show');

    Fliplet.Widget.autosize();
  }
});

$('.panel-group').on('shown.bs.collapse', '.panel-collapse', function() {
    Fliplet.Widget.autosize();
  })
  .on('hidden.bs.collapse', '.panel-collapse', function() {
    Fliplet.Widget.autosize();
  });

$('a[data-toggle="tab"').on('shown.bs.tab', function() {
    Fliplet.Widget.autosize();
  })
  .on('hidden.bs.tab', function() {
    Fliplet.Widget.autosize();
  });

$('[name="fl-store-keywords"]').on('tokenfield:createtoken', function(e) {
  var currentValue = e.currentTarget.value.replace(/,\s+/g, ',');
  var newValue = e.attrs.value;
  var oldAndNew = currentValue + ',' + newValue;

  if (oldAndNew.length > 100) {
    e.preventDefault();
  }
});

$('input[type="file"]').on('change', function() {
  $(this).parents('.fileUpload').next('.image-name').find('small').html($(this)[0].files[0].name);
});

$('.redirectToSettings, [data-change-settings]').on('click', function(event) {
  event.preventDefault();

  Fliplet.Studio.emit('navigate', {
    name: 'appSettings',
    params: {
      appId: Fliplet.Env.get('appId')
    }
  });
});

$('[data-change-assets]').on('click', function(event) {
  event.preventDefault();

  Fliplet.Studio.emit('navigate', {
    name: 'launchAssets',
    params: {
      appId: Fliplet.Env.get('appId')
    }
  });
});

$('[name="fl-store-type"]').on('change', function() {
  if ($(this).val() === "Games") {
    $('[for="fl-store-category-application"]').addClass('hidden');
    $('[for="fl-store-category-application"]').find('select').prop('required', false);
    $('[for="fl-store-category-games"]').removeClass('hidden');
    $('[for="fl-store-category-games"]').find('select').prop('required', true);
  } else {
    $('[for="fl-store-category-games"]').addClass('hidden');
    $('[for="fl-store-category-games"]').find('select').prop('required', false);
    $('[for="fl-store-category-application"]').removeClass('hidden');
    $('[for="fl-store-category-application"]').find('select').prop('required', true);
  }

});

$('#appStoreConfiguration, #enterpriseConfiguration').on('validated.bs.validator', function() {
  checkGroupErrors();
  Fliplet.Widget.autosize();
});

$('#appStoreConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
    return;
  }

  event.preventDefault();

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('appStore') > -1) {
      var requestAppConfirm;

      if (appStoreSubmission.status === "started") {
        requestAppConfirm = confirm("Are you sure you wish to request your app to be published?");
      } else {
        requestAppConfirm = confirm("Are you sure you wish to update your published app?");
      }

      if (requestAppConfirm) {
        saveAppStoreData(true);
      }
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
  } else {
    alert('You need to publish this app first.\nGo to "Step 1. Prepare your app" to publish your app.');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#enterpriseConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
    return;
  }

  event.preventDefault();

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('enterprise') > -1) {
      var requestAppConfirm;

      if (enterpriseSubmission.status === "started") {
        requestAppConfirm = confirm("Are you sure you wish to request your app to be published?");
      } else {
        requestAppConfirm = confirm("Are you sure you wish to update your published app?");
      }

      if (requestAppConfirm) {
        saveEnterpriseData(true);
      }
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
  } else {
    alert('You need to publish this app first.\nGo to "Step 1. Prepare your app" to publish your app.');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

/* SAVE PROGRESS CLICK */
$('[data-app-store-save]').on('click', function() {
  saveAppStoreData();
});
$('[data-enterprise-save]').on('click', function() {
  saveEnterpriseData();
});
$('[data-push-save]').on('click', function() {
  savePushData();
});

$(document).on('click', '[data-cancel-build-id]', function() {
  var buildId = $(this).data('cancel-build-id');

  Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/submissions/' + buildId
  })
  .then(function() {
    clearTimeout(initLoad);
    initialLoad(false, 0);
  })
});

/* INIT */
$('#appStoreConfiguration, #enterpriseConfiguration').validator().off('change.bs.validator input.bs.validator change.bs.validator focusout.bs.validator');
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');

function compileStatusTable(withData, origin, buildsData) {
  if (withData) {
    var template = Handlebars.compile(statusTableTemplate);
    var html = template(buildsData);

    if (origin === "appStore") {
      $statusAppStoreTableElement.html(html);
    }
    if (origin === "enterprise") {
      $statusEnterpriseTableElement.html(html);
    }
  } else {
    if (origin === "appStore") {
      $statusAppStoreTableElement.html('');
    }
    if (origin === "enterprise") {
      $statusEnterpriseTableElement.html('');
    }
  }

  Fliplet.Widget.autosize();
}

function checkSubmissionStatus(origin, googleSubmissions) {
  var submissionsToShow = _.filter(googleSubmissions, function(submission) {
    return submission.status === "queued" || submission.status === "submitted" || submission.status === "processing" || submission.status === "completed" || submission.status === "failed" || submission.status === "cancelled";
  });

  var buildsData = [];
  if (submissionsToShow.length) {
    submissionsToShow.forEach(function(submission) {
      var build = {};
      var appBuild;
      var debugApp;

      if (submission.result.appBuild && submission.result.appBuild.files) {
        appBuild = _.find(submission.result.appBuild.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.apk') {
            return true;
          }
        });
      }

      if (submission.result.debugApp && submission.result.debugApp.files) {
        debugApp = _.find(submission.result.debugApp.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.apk') {
            return true;
          }
        });
      }

      build.id = submission.id;
      build.updatedAt = ((submission.status === 'completed' || submission.status === 'failed' || submission.status === "cancelled") && submission.updatedAt) ?
        moment(submission.updatedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build.submittedAt = ((submission.status === 'queued' || submission.status === 'submitted') && submission.submittedAt) ?
        moment(submission.submittedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build[submission.status] = true;
      build.fileUrl = appBuild ? appBuild.url : '';

      if (userInfo.user && (userInfo.user.isAdmin || userInfo.user.isImpersonating)) {
        build.debugFileUrl = debugApp ? debugApp.url : '';
      }

      buildsData.push(build);
    });

    compileStatusTable(true, origin, buildsData);
  } else {
    compileStatusTable(false, origin);
  }
}

function submissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "android";
  });

  checkSubmissionStatus("appStore", asub);

  asub = _.maxBy(asub, function(el) {
    return new Date(el.updatedAt).getTime();
  });
  appStoreSubmission = asub;

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "android";
  });

  checkSubmissionStatus("enterprise", esub);

  esub = _.maxBy(esub, function(el) {
    return new Date(el.updatedAt).getTime();
  });
  enterpriseSubmission = esub;

  if (_.isEmpty(appStoreSubmission)) {
    Fliplet.App.Submissions.create({
        platform: 'android',
        data: {
          submissionType: "appStore"
        }
      })
      .then(function(submission) {
        appStoreSubmission = submission;
      });
  }

  if (_.isEmpty(enterpriseSubmission)) {
    Fliplet.App.Submissions.create({
        platform: 'android',
        data: {
          submissionType: "enterprise"
        }
      })
      .then(function(submission) {
        enterpriseSubmission = submission;
      });
  }
}

function googleSubmissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "android";
  });

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "android";
  });

  checkSubmissionStatus("appStore", asub);
  checkSubmissionStatus("enterprise", esub);
}

function getSubmissions() {
  return Fliplet.App.Submissions.get();
}

function initialLoad(initial, timeout) {
  if (!initial) {
    initLoad = setTimeout(function() {
      getSubmissions()
        .then(function(submissions) {
          googleSubmissionChecker(submissions);
          initialLoad(false, 15000);
        });
    }, timeout);
  } else {
    getSubmissions()
      .then(function(submissions) {
        if (!submissions.length) {
          return Promise.all([
            Fliplet.App.Submissions.create({
              platform: 'android',
              data: {
                submissionType: "appStore"
              }
            })
            .then(function(submission) {
              appStoreSubmission = submission;
            }),
            Fliplet.App.Submissions.create({
              platform: 'android',
              data: {
                submissionType: "enterprise"
              }
            })
            .then(function(submission) {
              enterpriseSubmission = submission;
            }),
          ]);
        }

        return Fliplet.API.request({
          cache: true,
          url: 'v1/user'
        })
        .then(function(user) {
          userInfo = user;
          submissionChecker(submissions);
          return Promise.resolve();
        });
      })
      .then(function() {
        // Fliplet.Env.get('appId')
        // Fliplet.Env.get('appName')
        // Fliplet.Env.get('appSettings')

        return Promise.all([
          Fliplet.API.request({
            cache: true,
            url: 'v1/apps/' + Fliplet.Env.get('appId')
          })
          .then(function(result) {
            appName = result.app.name;
            appIcon = result.app.icon;
            appSettings = result.app.settings;
          }),
          Fliplet.API.request({
            cache: true,
            url: 'v1/organizations/' + Fliplet.Env.get('organizationId')
          })
          .then(function(org) {
            organizationName = org.name;
          })
        ]);
      })
      .then(function() {
        if (appSettings.folderStructure) {
          var structure = [];
          hasFolders = true;
          var appleOnly = _.filter(appSettings.folderStructure, function(obj) {
            return obj.platform === 'apple';
          });

          return Promise.all(appleOnly.map((obj) => {
            return Fliplet.Media.Folders.get({folderId: obj.folderId})
              .then(function(result) {
                var tempObject = {
                  type: obj.type,
                  folderContent: result
                }

                structure.push(tempObject);
                return Promise.resolve(structure);
              });
          }))
          .then(function() {
            structure.forEach(function(el, idx) {
              if (el.type === 'mobile') {
                screenShotsMobile = el.folderContent.files
              }
              if (el.type === 'tablet') {
                screenShotsTablet = el.folderContent.files
              }
            });
          });
        } else {
          hasFolders = false;
          return;
        }
      })
      .then(function() {
        return Fliplet.API.request({
          method: 'GET',
          url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId')
        });
      })
      .then(function(response) {
        if (response.widgetInstance.settings && response.widgetInstance.settings) {
          notificationSettings = response.widgetInstance.settings;
        } else {
          notificationSettings = {};
        }

        init();
        initialLoad(false, 5000);
      });
  }
}

// Start
initLoad = initialLoad(true, 0);
