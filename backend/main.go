package main

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"log"

	"github.com/julienschmidt/httprouter"
)

var tpl *template.Template

func init() {
	tpl = template.Must(template.ParseGlob("../frontend/build/*.html"))
}

func main() {
	router := httprouter.New()

	router.GET("/", index)
	router.POST("/ws", connect)
	router.ServeFiles("/static/*filepath", http.Dir("../frontend/build/static"))

	log.Fatal(http.ListenAndServe(":8050", router))
}

func index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tpl.ExecuteTemplate(w, "index.html", nil)
}

func connect(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	defer r.Body.Close()
	bs, _ := ioutil.ReadAll(r.Body)
	fmt.Println(string(bs))
}

