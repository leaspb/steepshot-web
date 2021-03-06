import {openModal} from './modal';
import {getStore} from '../store/configureStore';
import {getPostsList} from './postsList';

export function initPostModal(point, index) {
  return {
    type: 'INIT_POST_MODAL',
    options: {
      point,
      currentIndex: index,
    }
  }
}

export function openPostModal(point, index, options) {
  return (dispatch) => {
    dispatch(initPostModal(point, index));
    dispatch(openModal(point, options));
  }
}

export function setPostModalOptions(options) {
  return (dispatch) => {
    dispatch({
      type: 'SET_POST_MODAL_OPTIONS',
      options
    });
  }
}

function swapPostModal(index) {
  return {
    type: 'SWAP_POST_MODAL',
    index
  }
}

export function nextPostModal(index) {
  let state = getStore().getState();
  if (Object.keys(state.modals).length >= 2) {
    return {
      type: 'CONFIRM_ACTION_IN_MODAL'
    }
  }
  let point = state.postModal.point;
  let postsList = state.postsList[point].posts;
  let positionPost = postsList.indexOf(index);
  return dispatch => {
    if (positionPost === postsList.length - 6) {
      dispatch(getPostsList(point));
    }
    if (positionPost === postsList.length - 1) {
      if (!state.postsList[point].hasMore) {
        dispatch({type: 'THE_POST_IS_LAST'})
      }
      if (state.postsList[point].loading) {
        dispatch({type: 'WAIT_NEXT_POSTS'});
      }
    } else {
      let newIndex = postsList[positionPost + 1];
      dispatch(swapPostModal(newIndex))
    }
  }
}

export function previousPostModal(index) {
  let state = getStore().getState();
  if (Object.keys(state.modals).length >= 2) {
    return {
      type: 'CONFIRM_ACTION_IN_MODAL'
    }
  }
  let point = state.postModal.point;
  let postsList = state.postsList[point].posts;
  let positionPost = postsList.indexOf(index);
  if (positionPost === 0) {
    return {
      type: 'THE_POST_IS_FIRST'
    }
  }
  return (dispatch) => {
    let newIndex = postsList[positionPost - 1];
    dispatch(swapPostModal(newIndex))
  }
}
