import React from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons'

class App extends React.Component {
    render(){
        return(
            <TopicTable/>
        );
    }
}

class TopicTable extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            topicList:[],
            activeItem:{
                id:null, 
                title:'',
                completed:false,
            },
            editing:false,
        }
        this.fetchTopics = this.fetchTopics.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.getCookie = this.getCookie.bind(this)
        this.startEdit = this.startEdit.bind(this)
        this.deleteTopic = this.deleteTopic.bind(this)
        this.upvoteTopic = this.upvoteTopic.bind(this)
    };

    getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        console.log('cookieValue:',cookieValue);
        return cookieValue;
    }

    componentWillMount(){
        this.fetchTopics();
    }

    fetchTopics(){
        console.log('Fetching...');
        fetch('http://127.0.0.1:8000/api/topic_list')
        .then(response => response.json())
        .then(data => 
            this.setState({
                topicList:data
            }),
        );
    }

    handleChange(e){
        var name = e.target.name;
        var value = e.target.value;
        console.log('Name:', name);
        console.log('Value:', value);
        this.setState({
            activeItem:{
                ...this.state.activeItem,
                title:value
            }
        });
    }

    handleSubmit(e){
        e.preventDefault();
        console.log('ITEM:', this.state.activeItem);
        var csrftoken = this.getCookie('csrftoken');
        var url = 'http://127.0.0.1:8000/api/topic_create/';
        if(this.state.editing === true){
            url = `http://127.0.0.1:8000/api/topic_update/${ this.state.activeItem.id}/`;
            this.setState({
                editing:false
            });
        }
        fetch(url, {
                method:'POST',
                headers:{
                'Content-type':'application/json',
                'X-CSRFToken':csrftoken,
            },
            body:JSON.stringify(this.state.activeItem)
        }).then((response)  => {
            this.fetchTopics()
            this.setState({
                activeItem:{
                    id:null, 
                    title:'',
                    completed:false,
                }
            })
        }).catch(function(error){
            console.log('ERROR:', error)
        });
    }

    startEdit(task){
        this.setState({
            activeItem:task,
            editing:true,
        });
    }


    deleteTopic(task){
        var csrftoken = this.getCookie('csrftoken')
        fetch(`http://127.0.0.1:8000/api/topic_delete/${task.id}/`, {
                method:'DELETE',
                headers:{
                'Content-type':'application/json',
                'X-CSRFToken':csrftoken,
            },
        }).then((response) =>{
            this.fetchTopics();
        });
    }


    upvoteTopic(topic){
        topic.votes += 1;
        var csrftoken = this.getCookie('csrftoken')
        var url = 'http://127.0.0.1:8000/api/topic_update/' + topic.id + '/';
        fetch(url, {
                method:'POST',
                headers:{
                'Content-type':'application/json',
                'X-CSRFToken':csrftoken,
            },
            body:JSON.stringify({'votes': topic.votes, 'title': topic.title})
        }).then(() => {
            this.fetchTopics()
        });
    }

    render(){
        const topics = this.state.topicList;
        const title = this.state.activeItem.title;
        return(
            <div className="container">
                <div id="task-container">
                    <Clock/>
                    <div id="form-wrapper">
                        <TopicForm onTopicSubmit={this.handleSubmit} onTopicChange={this.handleChange} title={title}/>
                    </div>
                    <div id="list-wrapper">         
                        <TopicList topics={topics} upvoteTopic={this.upvoteTopic} startEdit={this.startEdit} deleteTopic={this.deleteTopic}/>
                    </div>
                </div>
            </div>
        );
    }
}

class TopicForm extends React.Component {
    constructor(props){
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(e){
        this.props.onTopicSubmit(e);
    }

    handleChange(e){
        this.props.onTopicChange(e);
    }

    render(){
        const value = this.props.title;
        return(
            <form onSubmit={this.handleSubmit}  id="form">
                <div className="flex-wrapper">
                    <div style={{flex: 6}}>
                        <input onChange={this.handleChange} className="form-control" id="title" value={value} type="text" name="title" placeholder="Add English Club topic..." />
                    </div>
                    <div style={{flex: 1}}>
                        <input id="submit" className="btn btn-warning" type="submit" name="Add" />
                    </div>
                </div>
            </form>
        );
    }
}

function TopicList(props){
    const topics = props.topics;
    console.log('inside TopicList, topics:',topics);
    return (
        topics.map((topic) =>
            <TopicRow
                key={topic.id.toString()}
                topic={topic}
                upvoteTopic={props.upvoteTopic}
                startEdit={props.startEdit}
                deleteTopic={props.deleteTopic}/>
        )
    );
}

class TopicRow extends React.Component {
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleClick(e){
        this.props.upvoteTopic(this.props.topic);
    }

    handleEdit(e){
        this.props.startEdit(this.props.topic);
    }

    handleDelete(e){
        this.props.deleteTopic(this.props.topic);
    }

    render(){
        const self = this;
        const topic = this.props.topic;
        return(
            <div className="task-wrapper">
                <div className="topic-wrapper" style={{flex:5}}>
                    <div>
                        {topic.complete === false ? (
                            <span>{topic.title}</span>
                        ) : (
                            <div>
                                <strike>{topic.title}</strike>
                                <span style={{color:'#00cecb'}}> Done!</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="action-wrapper" style={{flex:5}}>
                    <div style={{flex:3}}>
                        <button onClick={this.handleClick} className="btn btn-sm btn-outline-primary">
                            <FontAwesomeIcon icon={faThumbsUp}/> Like
                        </button>
                        <span style={{flex:1, fontSize:18}}> : { topic.votes }</span>
                    </div>
                    <div style={{flex:1}}>
                        <button onClick={self.handleEdit} className="btn btn-sm btn-outline-info">Edit</button>
                    </div>
                    <div style={{flex:1}}>
                        <button onClick={self.handleDelete} className="btn btn-sm btn-outline-danger delete">Delete</button>
                    </div>
                </div>
            </div>
        );
    }
}

class Clock extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            timeNow: new Date()
        };
    }

    componentDidMount(){
        this.timeID = setInterval(
            () => this.tick(), 1000
        );
    }

    componentWillUnmount(){
        clearInterval(this.timeID);
    }

    tick(){
        this.setState({
            timeNow: new Date()
        });
    }

    render(){
        return (
            <div className="container">
                <div className="row pt-2">
                    <div className="col-5">
                        <div className="city">Taipei</div>
                    </div>
                    <div className="col-2">
                        <div className="city">vs.</div>
                    </div>
                    <div className="col-5">
                        <div className="city">New York</div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-5">
                        <div className="time">
                            {this.state.timeNow.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })}
                        </div>
                    </div>
                    <div className="col-2"></div>
                    <div className="col-5">
                        <div className="time">
                            {this.state.timeNow.toLocaleString('en-US', { timeZone: 'America/New_York' })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
