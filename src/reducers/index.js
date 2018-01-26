import {combineReducers} from 'redux';
import messages from './messages';
import auth from './auth';
import posts from './posts';
import search from './search';
import votes from './votes';
import clipboard from './clipboard';
import usersList from './usersList';
import postsList from './postsList';
import modals from './modals';
import postModal from './postModal';

export default combineReducers({
  clipboard,
  messages,
  auth,
  posts,
  search,
  votes,
  postsList,
  usersList,
  modals,
  postModal
});
