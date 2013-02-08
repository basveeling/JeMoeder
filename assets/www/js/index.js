/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    currenttaskslist: null,
    upcommingtaskslist: null,

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        var db = window.openDatabase("jemoederdb", "1.0", "JeMoeder DB", 200000);
        currenttaskslist = $("#currenttasks");
        upcommingtaskslist = $("#upcommingtasks");
        //Populate the list
        db.transaction(app.populateDB, app.errorCB, app.refetchTasks);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },

     // Populate the database 
    //
    populateDB: function(tx) {
        //Debug deletion of tables
        tx.executeSql('DROP TABLE IF EXISTS `tasks`');
        tx.executeSql('DROP TABLE IF EXISTS `completed_tasks`');

        //Setup database
        tx.executeSql('CREATE TABLE IF NOT EXISTS `tasks` (id unique, name, cycle_type, cycle_interval)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS `completed_tasks` (id unique, task_id, completion_date)');

        //Insert dummy data
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval) VALUES (1,"Beddengoed verschonen", "daily", 30)');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval) VALUES (2, "Was draaien", "daily", 7)');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval) VALUES (3, "Parteeeh", "daily", 2)');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval) VALUES (4, "Afwassen", "daily", 1)');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval) VALUES (5, "Bel je moeder!", "daily", 3)');


        tx.executeSql('INSERT INTO `completed_tasks` (task_id, completion_date) VALUES (1, date("now"))');
        tx.executeSql('INSERT INTO `completed_tasks` (task_id, completion_date) VALUES (2, date("now"))');

    },
    setDone: function(task) {

        var db = window.openDatabase("jemoederdb", "1.0", "JeMoeder DB", 200000);
        var taskobj = task;
        console.log("setdone recieved: ");
        console.log(taskobj.id);
        db.transaction(function (tx) {
            tx.executeSql('INSERT INTO `completed_tasks` (task_id, completion_date) VALUES (' + taskobj.id + ', date("now"))');
        }
        , app.errorCB, app.refetchTasks);
    },
    // Query the database
    //
    queryDB: function(tx) {
        tx.executeSql("SELECT *,date(`completed_tasks`.completion_date ,'+' || `tasks`.cycle_interval || ' days') as deadline, max(`completed_tasks`.completion_date) FROM `tasks` LEFT JOIN completed_tasks ON `tasks`.id = `completed_tasks`.task_id WHERE completed_tasks.completion_date IS NULL OR deadline <= date('now') GROUP BY `tasks`.id", [], app.querySuccessCurrent, app.errorCB);

        tx.executeSql("SELECT *,date(`completed_tasks`.completion_date ,'+' || `tasks`.cycle_interval || ' days') as deadline, max(`completed_tasks`.completion_date) FROM `tasks` LEFT JOIN completed_tasks ON `tasks`.id = `completed_tasks`.task_id WHERE deadline > date('now') GROUP BY `tasks`.id", [], app.querySuccessUpcomming, app.errorCB);
        // tx.executeSql("SELECT * FROM `tasks` LEFT JOIN completed_tasks AS CompeletedTask ON `tasks`.id = CompeletedTask.task_id GROUP BY `tasks`.id", [], app.querySuccess, app.errorCB);
    },

    // Query the success callback
    //
    querySuccessCurrent: function(tx, results) {
        var len = results.rows.length;
        console.log("Task table: " + len + " rows found.");
        for (var i=0; i<len; i++){
            console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).name + " interval =  " + results.rows.item(i).cycle_interval + " Completed date =  " + results.rows.item(i).completion_date + " Deadline date =  " + results.rows.item(i).deadline);
            var task = {
                id: results.rows.item(i).id,
                name: results.rows.item(i).name,
                cycle_type: results.rows.item(i).cycle_type,
                cycle_interval: results.rows.item(i).cycle_interval,
                completion_date: results.rows.item(i).completion_date,
            }

            app.drawTask(task,currenttaskslist);
        }
    }, // Query the success callback
    //
    querySuccessUpcomming: function(tx, results) {
        var len = results.rows.length;
        console.log("Task table: " + len + " rows found.");
        for (var i=0; i<len; i++){
            console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).name + " interval =  " + results.rows.item(i).cycle_interval + " Completed date =  " + results.rows.item(i).completion_date + " Deadline date =  " + results.rows.item(i).deadline);
            var task = {
                id: results.rows.item(i).id,
                name: results.rows.item(i).name,
                cycle_type: results.rows.item(i).cycle_type,
                cycle_interval: results.rows.item(i).cycle_interval,
                completion_date: results.rows.item(i).completion_date,
            }

            app.drawTask(task,upcommingtaskslist);
        }
    },
    // Transaction error callback
    //
    errorCB: function(err) {
        console.log("Error processing SQL: "+err.code);
    },

    // Transaction success callback
    //
    refetchTasks: function() {
        app.clearLists();
        var db = window.openDatabase("jemoederdb", "1.0", "JeMoeder DB", 200000);
        db.transaction(app.queryDB, app.errorCB);
    },
    clearLists: function() {
        upcommingtaskslist.empty();
        currenttaskslist.empty();
    },
    drawTask: function(task,tasklist) {
        var taskobj = task;
        var listobj = $("<li>" + task.name + "<span>Repeats: " + task.cycle_type  + "</span><span>Every: " + task.cycle_interval    + " days</span><span>Completed: " + task.completion_date  + "</span></li>");
        var doneobj = $("<a href=\"#\" class=\"done\">DONE</a>");
        listobj.append(doneobj);
        tasklist.append(listobj);

        doneobj.on('click', function() {
            console.log(taskobj);
            app.setDone(taskobj);
        }); 

    }


};
