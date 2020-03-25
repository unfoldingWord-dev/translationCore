import { createStore, applyMiddleware } from 'redux';
import { enableBatching } from 'redux-batched-actions';
import thunkMiddleware from 'redux-thunk';
import promise from 'redux-promise';
import rootReducers from '../reducers/index.js';
// import { createLogger } from 'redux-logger';
// import { stringifySafe } from '../helpers/FeedbackHelpers';

let middlewares = [
  thunkMiddleware,
  promise,
];

if (process.env.REDUX_LOGGER || process.env.NODE_ENV === 'development') {
  //TODO: this is a hack to keep redux logger from crashing, but still saw crash when opened project
  // middlewares.push(createLogger(
  //   {
  //     diff: false,
  //     stateTransformer: (state) => (stringifySafe(state,
  //       '[error loading system information]'))
  //   }
  // ));
}

export default function configureStore(persistedState) {
  return createStore(
    enableBatching(rootReducers),
    persistedState,
    applyMiddleware(...middlewares),
  );
}
