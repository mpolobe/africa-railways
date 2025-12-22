const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendTrainSpecificAlert = functions.firestore
    .document('trains/{trainId}')
    .onUpdate(async (change, context) => {
        const trainId = context.params.trainId;
        const data = change.after.data();
        const oldData = change.before.data();

        if (data.status === 'Emergency' && oldData.status !== 'Emergency') {
            const message = {
                notification: {
                    title: `🚨 EMERGENCY: ${data.trainName || trainId}`,
                    body: `Service suspended on the ${data.from} → ${data.to} route.`,
                },
                topic: `train_${trainId}`,
                webpush: {
                  headers: { Urgency: 'high' }
                }
            };
            return admin.messaging().send(message)
                .then((res) => console.log('Sent:', res))
                .catch((err) => console.error('Error:', err));
        }
        return null;
    });
