const project = 'mentos-ml-exp-235009';
const region = 'us-central1';
const cloudFunctionsRegion = 'europe-west1';
const automl_model = 'ICN3766759857308686916';
const automl = require('@google-cloud/automl');
const predictionClient = new automl.PredictionServiceClient();
// Firebase libraries
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialise Firebase services
admin.initializeApp();
const db = admin.firestore();

function callAutoMLAPI(b64img) {
  return new Promise((resolve, reject) => {
    const payload = {
      "image": {
        "imageBytes": b64img
      }
    }

    const reqBody = {
        name: predictionClient.modelPath(project, region, automl_model),
        payload: payload
    }

    predictionClient.predict(reqBody)
        .then(responses => {
            console.log('Got a prediction from AutoML API!', JSON.stringify(responses));
            resolve(responses);
        })
        .catch(err => {
            console.log('AutoML API Error: ',err);
            reject(err);
        });
  });
}

exports.callAutoML = functions
  .region(region)
  .https.onCall((data, context) => {
    return callAutoMLAPI(data.img)
});
