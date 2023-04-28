import axios from 'axios';
import { showAlert } from './alerts';

//type is either password or data
export const updateData = async (data, type) => {
    try{
        const partialUrl = type === 'password' ? 'updatePassword' : 'updateMe';
        const res = await axios({
            method:'PATCH',
            url: 'http://localhost:3000/api/v1/users/' + partialUrl,
            data,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        })
        if(res.data.status === 'success'){
            showAlert('success', `${type.toUpperCase()} successfully updated!`)
        }
    }catch(err){
        showAlert('error', err.response.data.message || 'Something went wrong.');
    }
}