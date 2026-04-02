
import { Router, Route } from "@solidjs/router";
import Header from './components/Header'
import Home from "./pages/Home";
import summary from "./assets/summary.json"
import View from "./pages/View";
import Footer from "./components/Footer";

function App() {

    return (
        <div class='h-full flex flex-col bg-gray-100 dark:bg-gray-900'>
            <Header/>
            <Router>
                <Route path="/" component={()=><Home summary={summary}/>}/>
                {
                    summary.flatMap(dir => dir.files).map(file => {
                        return <Route path={file.id} component={()=><View summary={summary} id={file.id}/>}/>
                    })
                }
            </Router>
            <Footer/>
        </div>
        
    )
}

export default App
