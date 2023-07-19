var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/messages', function(req, res, next) {
  res.send('respond with a resource');
});

/**********AGRAVAIN*********/
//Añadimos desarrollo de Agravain
//const express = require('express');
const { ActivityTypes } = require('botbuilder');
const { BotFrameworkAdapter } = require('botbuilder');
const { TurnContext } = require('botbuilder');
const axios = require('axios');


//const app = express();
//const app2 = express();
const adapter = new BotFrameworkAdapter({
    appId: '6da5ddd8-013b-4f9d-a42b-821f8035dbd1',
    appPassword: 'zAh8Q~.rf__BmWBTYQHyqYWKe7bP814hP6HfRdq2'
});

/*app2.listen(process.env.PORT || 3978, () => {
  console.log(`Servidor escuchando en el puerto ${process.env.PORT || 3978}`);
});*/

/*app.listen(process.env.PORT || port, () => {
    console.log(`Servidor escuchando en el puerto ${process.env.PORT || port}`);
});*/

const url = 'https://dev-agravainbot.cognitiveservices.azure.com/language/:analyze-conversations?projectName=Agravain-Orchestation&deploymentName=Agravain-Orchestation-Deployment-v0.1&api-version=2022-10-01-preview';
const subscriptionKey = '00e95f52cb4e409dad41116c1e15593a';
const requestId = '4ffcac1c-b2fc-48ba-bd6d-b69d9942995a';

router.post('/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
      if (context.activity.type === ActivityTypes.Message) {
          const turnContext = new TurnContext(adapter, context.activity);
          turnContext.activity.endpoint = url;
          
          if (context.activity.endpoint === url) {
              // Enviar la frase del usuario al nuevo endpoint
              const headers = {
                  'Ocp-Apim-Subscription-Key': subscriptionKey,
                  'Apim-Request-Id': requestId,
                  'Content-Type': 'application/json'
              };

              const data = {
                  kind: 'Conversation',
                  analysisInput: {
                      conversationItem: {
                          id: '1',
                          text: context.activity.text,
                          participantId: '1'
                      }
                  },
                  parameters: {
                      projectName: 'Agravain-Orchestation',
                      verbose: true,
                      deploymentName: 'Agravain-Orchestation-Deployment-v0.1',
                      stringIndexType: 'TextElement_V8'
                  }
              };

              try {
                  const response = await axios.post(url, data, { headers });
                  const responseData = response.data;
                  if (responseData && responseData.result && responseData.result.prediction && responseData.result.prediction.intents) {
                      const topIntent = responseData.result.prediction.topIntent;
                      const intents = responseData.result.prediction.intents;
                      const responses = []; // Array para almacenar las respuestas

                      //Filtramos el origen de los datos
                      switch (topIntent) {
                          case 'Agravain-FAQ':
                              // Respuesta con predicción para Agravain-FAQ
                             Object.keys(intents).forEach((intentKey) => {
                                  const intent = intents[intentKey];
      
                                  if (intent.result && intent.result.answers) {
                                      const answers = intent.result.answers;
      
                                      answers.forEach((answer) => {
                                          responses.push(answer.answer); // Agregar respuesta al array
                                      });
                                  } else {
                                      console.error('No se encontraron respuestas para el intent:', intentKey);
                                  }
                              });
                              break;
                      
                          case 'Agravain-Language':
                              // Lógica para Agravain-Language
                              if (intents && intents['Agravain-Language'] && intents['Agravain-Language'].result && intents['Agravain-Language'].result.prediction) {
                                  const prediction = intents['Agravain-Language'].result.prediction;
                                  const topIntent = prediction.topIntent;
                                  const entities = prediction.entities;

                                  // Accede a los datos específicos que necesitas
                                  const query = prediction.query;
                                  
                                  // Ejemplo de cómo puedes trabajar con las entidades
                                  if (entities && entities.length > 0) {
                                      for (let i = 0; i < entities.length; i++) {
                                          const entity = entities[i];
                                          const category = entity.category;
                                          const text = entity.text;
                                          // ...
                                          await context.sendActivity(category + ': ' + text);
                                          /*switch (entity.category){
                                            case 'CheckBuild':

                                            break;
                                            case 'CheckChampion':

                                            break;
                                            case 'CheckGames':

                                            break;
                                            case 'CheckGBI':
                                                //call service for GBI
                                                //getGBI(entity.text)
                                            break;
                                            case else

                                            break;
                                          }*/
                                      }
                                  }

                                  // ... Otras operaciones o lógica relacionada con Agravain-Language ...

                              } else {
                                  console.error('No se encontraron resultados para el intent Agravain-Language');
                              }
                              break;
                      
                          case 'Agravain-GPT':
                              // Lógica para Agravain-GPT
                              // ...
                              context.sendActivity('Agravain-GPT');
                              break;
                      
                          default:
                              console.error('Top Intent desconocido:', topIntent);
                              break;
                      }

                      // Enviar las respuestas si no se ha respondido previamente
                      if (!turnContext.responded && responses.length > 0) {
                          await turnContext.sendActivity(responses.join('\n'));
                      } else {
                          console.error('No se encontraron respuestas para ninguna intención o ya se ha respondido previamente');
                      }
                  } else {
                      console.error('La estructura de la respuesta es incorrecta');
                  }
              } catch (error) {
                  console.error("error: " + error);
              }
          }
      } else {
          await context.sendActivity('Hola, soy Agravain, tu asistente virtual.');
      }
  });
}); 

/**********************************************/

module.exports = router;

