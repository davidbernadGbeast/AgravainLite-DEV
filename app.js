var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

/********************************************* */
//Añadimos desarrollo de Agravain
//const express = require('express');
const { ActivityTypes } = require('botbuilder');
const { BotFrameworkAdapter } = require('botbuilder');
const { TurnContext } = require('botbuilder');
const axios = require('axios');

//const app = express();
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

app.listen(process.env.PORT || 3978, () => {
  console.log(`Servidor escuchando en el puerto ${process.env.PORT || 3978}`);
});

const url = 'https://dev-agravainbot.cognitiveservices.azure.com/language/:analyze-conversations?projectName=Agravain-Orchestation&deploymentName=Agravain-Orchestation-Deployment-v0.1&api-version=2022-10-01-preview';
const subscriptionKey = '00e95f52cb4e409dad41116c1e15593a';
const requestId = '4ffcac1c-b2fc-48ba-bd6d-b69d9942995a';

app.post('/api/messages', (req, res) => {
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
                                          //await context.sendActivity(category + ': ' + text);
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

/********************************************* */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
