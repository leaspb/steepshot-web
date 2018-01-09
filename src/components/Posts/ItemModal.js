import React from 'react';
import ReactDOM from 'react-dom';
import Steem from '../../libs/steem';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import Comments from './Comments';
import PropTypes from 'prop-types';
import constants from '../../common/constants';
import VouteComponent from './VouteComponent';
import AddComment from './AddComment';
import FlagComponent from './FlagComponent';
import ShareComponent from './ShareComponent';
import LoadingSpinner from '../LoadingSpinner';
import ScrollViewComponent from '../Common/ScrollViewComponent';
import TagComponent from './TagComponent';
import AvatarComponent from '../Atoms/AvatarComponent';
import TimeAgo from 'timeago-react';
import { Collapse } from 'react-collapse';
import Constants from '../../common/constants';

import utils from '../../utils/utils';
import ShowIf from '../Common/ShowIf';
import { UserLinkFunc } from '../Common/UserLinkFunc';

const START_TEXTAREA_HEIGHT = '42px';
const START_TEXTAREA_WIDTH = '280px';

class ItemModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            avatar : this.props.item.avatar,
            item : this.props.item,
            index : this.props.index,
            initialIndex : this.props.index,
            image : this.props.item.body,
            items : this.props.items,
            comments : [],
            disableNext : false,
            disablePrev : false,
            redirectToReferrer : false,
            needsCommentFormLoader : false,
            isLoading : false,
            hasMore : this.props.hasMore,
            loadMore : this.props.loadMore,
            adultParam : false,
            moneyParam : true,
            lowParam : false,
            closeParam : false,
            mirrorData : '',
            txtHeight : START_TEXTAREA_HEIGHT,
            txtWidth : START_TEXTAREA_WIDTH,
            fullScreenMode : true,
            noFullScreen : true,
            commentValue : ''
        };
        this.mobileCoverParams = {
          width: '100%',
          height: '100%'
        };
        this.initKeypress();
    }

    needMore() {
      this.controlRestrictions();
      if (this.state.isLoading || !this.state.hasMore) return false;
      const curIndex = this.state.index;
      if (curIndex + 7 >= this.state.items.length) {
        this.setState({
          isLoading : true
        }, () => {
          this.state.loadMore();
        });
      }
    }

    controlRestrictions() {
      if (this.state.item.is_nsfw) {
        this.setState({adultParam : true});
      } else {
        this.setState({adultParam : false});
      }
      if (this.state.item.total_payout_reward == 0) {
        this.setState({moneyParam : false});
      }
      if (this.state.item.is_low_rated) {
        this.setState({lowParam : true});
      } else {
        this.setState({lowParam : false});
      }
    }

    openLikesModal() {
      this.props.dispatch({ type : 'CLEAR_LIKES_INFO', url : this.state.item.url });
      jqApp.openLikesModal($(document));
    }

    likeCheck() {
      let like = this.state.item.net_likes;
      if (like == 0) {
        return false
      } else if (like == 1 || like == -1) {
        like = `${like} like`
      } else {
        like = `${like} likes`
      }
      return (
        <div className="likes" onClick={this.openLikesModal.bind(this)}>{like}</div>
      )
    }

    lookTextarea() {
      let firstSpace = this.commentInput.value.match(/\s+/);
      if (firstSpace && firstSpace['index'] == 0) {
        this.commentInput.value = '';
      } else if (this.commentInput.value != '') {
        this.sendButton.classList.add('send-button_item-mod');
      } else {
        this.sendButton.classList.remove('send-button_item-mod');
      }
      this.liveTextArea();
    }

    liveTextArea() {
      this.setState({mirrorData : this.commentInput.value}, () => {
        if (this.hiddenDiv != undefined) {
          this.setState({txtHeight : this.hiddenDiv.clientHeight + 'px', txtWidth : this.commentInput.clientWidth}, () => {
          });
        } else {
          this.setState({txtHeight : START_TEXTAREA_HEIGHT});
        }
      });
    }

    moneyCheck() {
      let money = this.state.item.total_payout_reward;
      if (money == 0) {
        return false
      }
      return (
        <div>{utils.currencyChecker(money)}</div>
      )
    }

    clearNewComment(callback) {
      this.setState({
        newComment : null,
        txtHeight : START_TEXTAREA_HEIGHT
      }, () => callback ? callback() : false);
    }

    componentWillReceiveProps(nextProps) {
      let isLoading = this.state.isLoading;
      if (isLoading)
      if (this.state.items != nextProps.items) {
        isLoading = false;
      }
      this.setState({
        item : nextProps.index == this.state.initialIndex ? this.state.item : nextProps.item,
        items : nextProps.items,
        index: nextProps.index == this.state.initialIndex ? this.state.index : nextProps.index,
        initialIndex : nextProps.index,
        comments : [],
        disableNext : false,
        disablePrev : false,
        redirectToReferrer : false,
        newComment : null,
        isLoading : isLoading
      }, () => {
        this.needMore();
      });
    }

    componentDidMount() {
      this.needMore(this.props);
      setTimeout(() => {
        jqApp.forms.init();
      }, 0);
      this.closeButtonFunc();
      window.addEventListener('resize', () => {
        this.closeButtonFunc();
      });
    }

    hideFunc() {
      this.setState({adultParam : false, lowParam : false});
    }

    clearCommentInput() {
      if (this.commentInput && this.formGr) {
        this.label.style.top = '12px';
        this.commentInput.value = '';
        this.sendButton.classList.remove('send-button_item-mod');
      }
    }

    sendComment(e) {
      e.preventDefault();
      let comment = this.commentInput.value;
      if (comment == '') return false;

      const urlObject = this.state.item.url.split('/');

      const callback = (err, success) => {
        this.setState({
          needsCommentFormLoader : false,
          txtHeight : START_TEXTAREA_HEIGHT
        });
        if (err) {
          jqApp.pushMessage.open(err);
          this.commentInput.value = '';
        } else if (success) {
            this.setState({
              newComment : {
                net_votes : 0,
                vote : false,
                avatar : this.props.avatar,
                author : this.props.username,
                total_payout_value : 0,
                body : comment,
                created : Date.now()
              }
            }, () => {
              jqApp.pushMessage.open(Constants.COMMENT_SUCCESS_MESSAGE);
              this.scrollView.scrollBar.scrollToBottom();
            });
        }
        this.clearCommentInput();
      };

      this.setState({
        needsCommentFormLoader : true
      }, () => {
        Steem.comment(
          this.props.postingKey,
          this.state.item.author,
          urlObject[urlObject.length - 1],
          this.props.username,
          this.commentInput.value,
          this.state.item.tags,
          callback
        );
      });
    }

    initKeypress() {
      document.onkeydown = (e) => {
        if (document.activeElement !== ReactDOM.findDOMNode(this.commentInput)) {
          switch (e.keyCode) {
            case 37:
              this.previous();
              break;
            case 39:
              this.next();
              break;
            default :
              break;
          }
        }
      }
    }

    setDefaultImage() {
      this.setState({
        image: constants.NO_IMAGE
      });
    }

    next() {
      if (this.state.index < this.state.items.length - 1) {
        this.clearCommentInput();
        this.clearNewComment(this.resetDefaultProperties(this.state.items[this.state.index + 1], 1));
      }
    }

    previous() {
      if (this.state.index > 0) {
        this.clearCommentInput();
        this.clearNewComment(this.resetDefaultProperties(this.state.items[this.state.index - 1], -1));
      }
    }

    resetDefaultProperties(newItem, indexUpdater) {
      this.setState({
        item: newItem,
        index: this.state.index + indexUpdater
      });
      this.needMore();
    }

    redirectToLoginPage() {
      this.props.history.push('/signin');
    }

    callPreventDefault(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    openDescription() {
      this.setState({isDescriptionOpened : true});
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (this.state.index != nextState.index)
      if (this.state.isDescriptionOpened) this.setState({ isDescriptionOpened : false });
      return true;
    }

    renderDescription() {
      let forceOpen = false;
      let descriptionStart = this.state.item.description.replace(/(<\w+>)+/, '');
      if (descriptionStart.replace(/\n[\w\W]+/, '').length < 140) forceOpen = true;
      return (
        <div className="post-description">
          <p>{UserLinkFunc(true, this.state.item.title)}</p>
          <div
            className={(this.state.isDescriptionOpened || forceOpen) ? "collapse-opened" : "collapse-closed"}
          >
              {UserLinkFunc(false, this.state.item.description)}
              {
                this.state.item.tags.map((tag, index) => {
                  return <span key={index}><TagComponent tag={tag} /> </span>
                })
              }
              <a className="lnk-more" onClick={this.openDescription.bind(this)}>Show more</a>
          </div>
        </div>
      )
    }

    closeButtonFunc() {
      if (document.documentElement.clientWidth <= 815) {
        this.setState({closeParam : true});
      } else {
        this.setState({closeParam : false});
      }
      if (document.documentElement.clientWidth <= 1023) {
        this.setState({noFullScreen : false});
      } else {
        this.setState({noFullScreen : true});
      }
    }

    fullScreen() {
      if(this.state.fullScreenMode && this.state.noFullScreen) {
        this.setState({commentValue : this.commentInput.value, fullScreenMode : false}, () => {
          this.props.fullParam(this.state.fullScreenMode);
          this.img.classList.add('post__image-container-full-screen-img');
          this.imgContainer.classList.add('post__image-container-full-screen');
          this.imgContainer.style.background = '#000000';
        });
      } else {
        this.setState({fullScreenMode : true}, () => {
          if (this.state.commentValue) {
            this.label.style.top = '-12px';
            this.commentInput.value = this.state.commentValue;
            this.sendButton.classList.add('send-button_item-mod');
          }
          this.props.fullParam(this.state.fullScreenMode);
          this.img.classList.remove('post__image-container-full-screen-img');
          this.imgContainer.classList.remove('post__image-container-full-screen');
          this.imgContainer.style.background = '#fafafa'
          this.setState({commentValue : ''});
        });
      }
    }

    focusInput() {
      this.label.style.top = '-12px';
    }
    blurInput() {
      if (this.commentInput.value == '') {
        this.label.style.top = '12px';
      }
    }

    render() {
      let itemImage = this.state.item.body || constants.NO_IMAGE;
      let isUserAuth = (this.props.username && this.props.postingKey);
      const authorLink = `/@${this.state.item.author}`;

      return(
        <div>
          <div className="post-single">
            {
              this.state.closeParam
                ?
                <div className="crossWrapper">
                  <div className="user-wrap clearfix">
                    <div className="date">
                      <TimeAgo
                        datetime={this.state.item.created}
                        locale='en_US'
                      />
                    </div>
                    <Link to={authorLink} className="user">
                      <AvatarComponent src={this.state.item.avatar} />
                      <div className="name">{this.state.item.author}</div>
                    </Link>
                    <div onClick={this.props.closeFunc.bind(this)} className="modalButtonWrapper">
                      <i className="modalButton"></i>
                    </div>
                  </div>
                </div>
                :
                null
            }
            <div className="post-wrap post">
              <div className="post__image-container position--relative" ref={ ref => {this.imgContainer = ref} }>
                {
                  this.state.adultParam
                  ?
                    <div style={this.mobileCoverParams}>
                      <div className="forAdult2">
                        <div className="forAdultInner">
                          <p className="par1">NSFW content</p>
                          <p className="par2">This content is for adults only. Not recommended for children or sensitive individuals.</p>
                          <button className="btn btn-index" onClick={this.hideFunc.bind(this)}>Show me</button>
                        </div>
                      </div>
                      <img src={itemImage} alt="Post picture." ref={ ref => {this.img = ref} } onDoubleClick={this.fullScreen.bind(this)} />
                    </div>
                  :
                    this.state.lowParam
                  ?
                    <div style={this.mobileCoverParams}>
                      <div className="forAdult2">
                        <div className="forAdultInner">
                          <p className="par1">Low rated content</p>
                          <p className="par2">This content is hidden due to low ratings.</p>
                          <button className="btn btn-index" onClick={this.hideFunc.bind(this)}>Show me</button>
                        </div>
                      </div>
                      <img src={itemImage} alt="Post picture." ref={ ref => {this.img = ref} } onDoubleClick={this.fullScreen.bind(this)} />
                    </div>
                  :
                    <div>
                      <ShareComponent
                        moneyParam={this.state.moneyParam}
                        url={this.state.item.url}
                        title="Share post"
                        containerModifier="block--right-top box--small post__share-button"
                      />
                      <ShowIf show={this.state.noFullScreen}>
                        {
                          this.state.fullScreenMode
                          ?
                            <div title="Full screen mode" className="full-screen_item-mod full-screen_item-mod1" onClick={this.fullScreen.bind(this)}></div>
                          :
                            <div title="Modal screen" className="full-screen_item-mod full-screen_item-mod2" onClick={this.fullScreen.bind(this)}></div>
                        }
                      </ShowIf>
                      <img src={itemImage} alt="Post picture." ref={ ref => {this.img = ref} } onDoubleClick={this.fullScreen.bind(this)} />
                    </div>
                }
              </div>
              <ShowIf show={this.state.fullScreenMode} >
                <div className="post__description-container">
	                {
	                  this.state.closeParam
	                  ?
	                    null
	                  :
	                    <div className="user-wrap clearfix">
	                      <div className="date">
	                        <TimeAgo
	                          datetime={this.state.item.created}
	                          locale='en_US'
	                        />
	                      </div>
	                      <Link to={authorLink} className="user">
	                        <AvatarComponent src={this.state.item.avatar} />
	                        <div className="name">{this.state.item.author}</div>
	                      </Link>
	                    </div>
	                }
	                <div className="post-controls clearfix">
	                  <div className="buttons-row" onClick={(e)=>{this.callPreventDefault(e)}}>
	                    <VouteComponent
	                      key='vote'
	                      item={this.state.item}
	                      index={this.state.index}
	                      updateVoteInComponent={this.props.updateVoteInComponent}
	                      parent='post'
	                    />
	                    <FlagComponent
	                      key="flag"
	                      item={this.state.item}
	                      index={this.state.index}
	                      updateFlagInComponent={this.props.updateFlagInComponent}
	                    />
	                  </div>
	                  <div className="wrap-counts clearfix">
	                    <div className="likeMoneyPopup">
	                      {this.likeCheck()}
	                      {this.moneyCheck()}
	                    </div>
	                  </div>
	                </div>
	                <ScrollViewComponent
	                  ref={ (ref) => this.scrollView = ref }
	                  wrapperModifier="list-scroll"
	                  scrollViewModifier="list-scroll__view"
	                  autoHeight={window.innerWidth < constants.DISPLAY.DESK_BREAKPOINT}
	                  autoHeightMax={350}
	                  autoHeightMin={100}
	                  autoHide={true}
	                  isUserAuth={isUserAuth}
	                >
	                  {this.renderDescription()}
	                  <Comments
	                    key="comments"
	                    item={this.state.item}
	                    newComment={this.state.newComment}
	                    replyUser={this.commentInput}
	                  />
	                </ScrollViewComponent>
	                {
	                  isUserAuth
	                  ?
	                    <div className="post-comment">
	                      <div className="comment-form form-horizontal">
	                        <div className="form-group clearfix" ref={ (ref) => {this.formGr = ref} }>
	                          {
	                            this.state.needsCommentFormLoader
	                            ?
	                              <div className="loaderInComments">
	                                <LoadingSpinner />
	                              </div>
	                              :
	                              <div className="btn-wrap">
	                                <button
	                                  type="submit"
	                                  className="btn-submit"
	                                  onClick={this.sendComment.bind(this)}
	                                  ref={ ref => {this.sendButton = ref} }
	                                  style={{top : (this.state.txtHeight.replace(/px/, '') - 40) + 'px'}}
	                                  >Send</button>
	                              </div>
	                          }
	                          <div className="input-container">
	                            <textarea
	                              ref={ (ref) => {this.commentInput = ref} }
	                              style={{height : this.state.txtHeight}}
	                              id="formCOMMENT"
	                              name="commentValue"
	                              maxLength={2048}
	                              className="form-control resize-textarea_item-mod"
	                              onChange={this.lookTextarea.bind(this)}
	                              onFocus={this.focusInput.bind(this)}
	                              onBlur={this.blurInput.bind(this)}
	                            />
	                            <ShowIf show={!!this.state.mirrorData}>
	                              <div className="hidden-div_item-mod" style={{width : this.state.txtWidth}} ref={ ref => {this.hiddenDiv = ref} }>
	                                {this.state.mirrorData}
	                              </div>
	                            </ShowIf>
	                            <label htmlFor="formCOMMENT" className="name">Comment</label>
	                          </div>
	                        </div>
	                      </div>
	                    </div>
	                  :
	                    null
	                }
                </div>
              </ShowIf>
            </div>
          </div>
        </div>
      );
    }
}

ItemModal.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};

const mapStateToProps = (state) => {
  return {
    reply: state.comment.author,
    localization: state.localization,
    username: state.auth.user,
    postingKey: state.auth.postingKey,
    avatar: state.auth.avatar
  };
};

export default connect(mapStateToProps)(ItemModal);
