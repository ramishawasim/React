import{useState} from 'react'

function ExpenseTracker(props){
    const[strawCount, setStrawCount]= useState(0)

    function handleClick(){
        setStrawCount(prev => prev + 1);
    }

    return(
        <>
        <h3> Component </h3>
        <p>There are {strawCount} strawberries and we are feeling {props.mood}</p>
        <button onClick={handleClick}>Increase strawberry count</button>

        </>
    )
}

export default ExpenseTracker