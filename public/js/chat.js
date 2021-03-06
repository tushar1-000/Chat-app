const socket = io()

//Elements
const $messageForm = document.getElementById('message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.getElementById('send-location')
const $messages = document.getElementById('messages')
const $sidebar = document.getElementById('sidebar')



//Templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a ')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})


/*========================================
=            Location Message            =
========================================*/
socket.on('locationMessage', (message) => {
    console.log('This is the location', message.location)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        location: message.location,
        createdAt: moment(message.createdAt).format('h:mm a ')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})
/*=====  End of Location Message  ======*/

/*================================
=            roomdata            =
================================*/
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})


/*=====  End of roomdata  ======*/



/**
 *
 * Enabling and disabling submit button
 *
 */

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (err) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (err) {
            return console.error(err)
        }
        console.log('The message is delivered')
    })
});



/*=========================================
=            Location Sharing             =
=========================================*/

document.getElementById('send-location').addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        let data = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', data, () => {
            $sendLocation.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
});

/*=====  End of Location Sharing   ======*/





/* Sending the username and room */

socket.emit('join', { username, room }, (err) => {
    if (err) {
        alert(err)
        location.href = '/'
    }
})