import React from 'react';
import {Link, withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {logout} from '../actions/auth';
import Constants from '../common/constants';

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: '',
      sizeParam: false,
    };
  }

  baseBrowseFilter() {
    const baseBrowseFilter = localStorage.getItem('browse') == undefined
      ? Constants.BROWSE_ROUTES[0].NAME
      : localStorage.getItem('browse');
    return baseBrowseFilter;
  }

  scrollTopAndReload() {
    if (window.location.pathname == '/feed') {
      window.location.reload();
    } else if (/\/browse\/\w+/.test(window.location.pathname)) {
      window.location.reload();
    }
  }

  componentDidMount() {
    if (this.refs[this.props.location.pathname]) $(
      this.refs[this.props.location.pathname]).addClass('active');
    // setTimeout(() => {
    //   jqApp.search.init();
    // }, 0);
  }

  componentWillMount() {
    this.forResize();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.refs[this.props.location.pathname]) $(
      this.refs[this.props.location.pathname]).removeClass('active');
    if (this.refs[nextProps.location.pathname]) $(
      this.refs[nextProps.location.pathname]).addClass('active');

    return true;
  }

  handleLogout(event) {
    event.preventDefault();
    logout(this.props.history, this.props.dispatch);
  }

  _changeLanguageEn() {
    event.preventDefault();
    LocalizedStrings.setNewLanguage('en');
    this.forceUpdate();
  }

  _changeLanguageIt() {
    event.preventDefault();
    LocalizedStrings.setNewLanguage('ru');
    this.forceUpdate();
  }

  searchKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.props.history.push(`/search/${this.state.searchValue}`);
    }
  }

  searchHandleChange(e) {
    let value = e.target.value.toLowerCase();
    this.setState({searchValue: value});
  }

  forResize() {
    if (document.body.clientWidth < 420) {
      this.setState({sizeParam: true});
    }
  }

  render() {
    const isUserAuth = this.props.user && this.props.postingKey;
    let browse;
    let authorLink = '';

    let loginComponent = <div className="section login">
      <div className="wrap-login">
        <Link to="/signin" className="btn btn-default btn-xs">
          Sign in
        </Link>
      </div>
    </div>;

    if (isUserAuth) {
      authorLink = `/@${this.props.user}`;
      loginComponent = <div className="section controls">
        <div className="wrap-controls">
          <Link to="/settings" className="btn-control settings"/>
          <a onClick={this.handleLogout.bind(this)}
             className="btn-control logout"/>
        </div>
      </div>;
    }

    browse = <div className="section menu">
      <div className="wrap-menu">
        {
          (isUserAuth) ? (
            <div className="item nav-item"
                 onClick={this.scrollTopAndReload.bind(this)}>
              <Link to="/feed">Feed</Link>
            </div>
          ) : null
        }
        <div className="item nav-item"
             onClick={this.scrollTopAndReload.bind(this)}>
          <Link to={`/browse/${this.baseBrowseFilter()}`}>Browse</Link>
        </div>
      </div>
    </div>;

    return (
      <header className="g-header">
        <div className="container">
          <div className="user-panel">
            <div className="wrap-panel clearfix">
              {
                isUserAuth
                  ? <div className="section hamburger">
                    <div className="wrap-hamburger">
                      <button type="button" className="mm-opener">
                        <span className="ico"/>
                      </button>
                    </div>
                  </div>
                  : null
              }
              {loginComponent}
              <div className="section create">
                <div className="wrap-create">
                  {
                    isUserAuth
                      ? <div>
                        <Link to="/createPost" type="button"
                              className="btn btn-default btn-xs btn-create">
                          Create post
                        </Link>
                        <Link to="/createPost" type="button"
                              className="btn btn-default btn-create-mob"
                              onClick={() => {jqApp.mobileMenu._menuHide();}}
                        />
                      </div>
                      : null
                  }
                </div>
              </div>
              <div className="section user">
                <div className="wrap-user">
                  {
                    this.props.user
                      ? <Link to={authorLink} className="user-link clearfix">
                        <div className="photo">
                          {
                            this.props.avatar
                              ? <img src={this.props.avatar} alt="user"/>
                              : <img src="/static/images/person.png" alt="user"/>
                          }
                        </div>
                        <div className="name">{this.props.user}</div>
                      </Link>
                      : null
                  }
                </div>
              </div>
              <div className="section logo">
                <a href="/" className="wrap-logo">
                  <img src="/static/images/steepshotLogo@2x.svg" alt="logo"/>
                </a>
              </div>
              <div className="section search">
                <div className="wrap-search">
                  <a href="#" className="lnk-search">Search</a>
                  <a href="#" className="lnk-search-mob"/>
                </div>
              </div>
              {browse}
            </div>
          </div>
          <div className="search-panel closed">
            <div className="wrap-panel container clearfix">
              <div className="wrap-btn">
                <button type="button" className="btn-close"
                        onClick={() => {this.setState({searchValue: ''}); }}/>
              </div>
              <div className="wrap-search">
                <form className="form-search">
                  <input
                    type="text"
                    name="search"
                    value={this.state.searchValue}
                    onChange={this.searchHandleChange.bind(this)}
                    required={true}
                    placeholder={
                      this.state.sizeParam
                        ? Constants.SEARCH_PLACEHOLDER_MIN
                        : Constants.SEARCH_PLACEHOLDER
                    }
                    className="input-search"
                    onKeyPress={this.searchKeyPress.bind(this)}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

Header.propTypes = {
  history: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  return {
    postingKey: state.auth.postingKey,
    user: state.auth.user,
    avatar: state.auth.avatar,
    localization: state.localization,
  };
};

export default withRouter(connect(mapStateToProps)(Header));
