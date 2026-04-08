
import { Router, Route } from "@solidjs/router";
import Header from './components/Header'
import Home from "./pages/Home";
import summary from "./assets/summary.json"
import View from "./pages/View";
import Footer from "./components/Footer";
import type { Summary } from "./types/summary";

function App() {

    return (
        <div class='h-full flex flex-col bg-gray-100 dark:bg-gray-900'>
            <Header/>
            <Router>
                <Route path="/" component={()=><Home summary={summary as Summary}/>}/>
                {
                    summary.flatMap(dir => dir.docs).map(doc => {
                        return <Route path={doc.id} component={()=><View summary={summary as Summary} id={doc.id}/>}/>
                    })
                }
            </Router>
            <Footer/>
        </div>
        
    )
}

export default App
