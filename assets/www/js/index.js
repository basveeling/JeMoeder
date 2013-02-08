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
        //Bind clicks
        $("#tasksbutton").on('click',app.showTasks);
        $("#tipsbutton").on('click',app.showTips);
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
        tx.executeSql('CREATE TABLE IF NOT EXISTS `tasks` (id unique, name, cycle_type, cycle_interval, last_completed)');

        //Insert dummy data
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval, last_completed) VALUES (1,"Beddengoed", "daily", 30, date("2013-01-01"))');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval, last_completed) VALUES (2, "Was draaien", "daily", 7, date("now"))');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval, last_completed) VALUES (3, "Parteeeh every day!", "daily", 1, date("2013-02-06"))');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval, last_completed) VALUES (4, "Afwassen", "daily", 2, date("2013-01-08"))');
        tx.executeSql('INSERT INTO `tasks` (id, name, cycle_type, cycle_interval, last_completed) VALUES (5, "Bel je moeder!", "daily", 3, date("2013-01-01"))');

    },
    setDone: function(task) {

        var db = window.openDatabase("jemoederdb", "1.0", "JeMoeder DB", 200000);
        var taskobj = task;
        console.log("setdone recieved: ");
        console.log(taskobj.id);
        db.transaction(function (tx) {
            tx.executeSql('UPDATE `tasks` SET last_completed = date("now") WHERE `id` = ' +taskobj.id);
        }
        , app.errorCB, app.refetchTasks);
    },
    // Query the database
    //
    queryDB: function(tx) {
        tx.executeSql("SELECT *, date(last_completed ,'+' || `tasks`.cycle_interval || ' days') as deadline FROM tasks WHERE deadline <= date('now') ORDER BY deadline ASC", [], app.querySuccessCurrent, app.errorCB);

        tx.executeSql("SELECT *, date(last_completed ,'+' || `tasks`.cycle_interval || ' days') as deadline FROM tasks WHERE deadline > date('now') ORDER BY deadline ASC", [], app.querySuccessUpcomming, app.errorCB);
        // tx.executeSql("SELECT * FROM `tasks` LEFT JOIN completed_tasks AS CompeletedTask ON `tasks`.id = CompeletedTask.task_id GROUP BY `tasks`.id", [], app.querySuccess, app.errorCB);
    },

    // Query the success callback
    //
    querySuccessCurrent: function(tx, results) {
        var len = results.rows.length;
        console.log("Task table: " + len + " rows found.");
        for (var i=0; i<len; i++){
            console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).name + " interval =  " + results.rows.item(i).cycle_interval + " Completed date =  " + results.rows.item(i).last_completed + " Deadline date =  " + results.rows.item(i).deadline);
            var task = {
                id: results.rows.item(i).id,
                name: results.rows.item(i).name,
                cycle_type: results.rows.item(i).cycle_type,
                cycle_interval: results.rows.item(i).cycle_interval,
                last_completed: results.rows.item(i).last_completed,
                deadline: results.rows.item(i).deadline,
            }

            app.drawTask(task,currenttaskslist, false);
        }
    }, // Query the success callback
    //
    querySuccessUpcomming: function(tx, results) {
        var len = results.rows.length;
        console.log("Task table: " + len + " rows found.");
        for (var i=0; i<len; i++){
            console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Data =  " + results.rows.item(i).name + " interval =  " + results.rows.item(i).cycle_interval + " Completed date =  " + results.rows.item(i).last_completed + " Deadline date =  " + results.rows.item(i).deadline);
            var task = {
                id: results.rows.item(i).id,
                name: results.rows.item(i).name,
                cycle_type: results.rows.item(i).cycle_type,
                cycle_interval: results.rows.item(i).cycle_interval,
                last_completed: results.rows.item(i).last_completed,
                deadline: results.rows.item(i).deadline,
            }
            app.drawTask(task,upcommingtaskslist, true);
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
    showTasks: function() {
        $("#tipsview").fadeOut(500);
        $("#tasksview").fadeIn(500);
    },
    showTips: function() {
        $("#tasksview").fadeOut(500);
        $("#tipsview").fadeIn(500);
    },

    drawTask: function(task,tasklist, ident) {
        //Calculate the timedifference
        var today=new Date()
        var deadline=new Date(task.deadline) //Month is 0-11 in JavaScript


        //Set 1 day in milliseconds
        var one_day=1000*60*60*24

        //Calculate difference btw the two dates, and convert to days
        var days = Math.abs(Math.ceil((deadline.getTime()-today.getTime())/(one_day)));
        var taskobj = task;
        var listobj = $("<li></li>");
        var nameobj = $("<span class=\"name\">" + task.name + "</span>");
        var daysobj = $("<span class=\"days\">" + days + "</span>");
        var doneobj = $("<a href=\"#\" class=\"done\"></a>");

        if(ident) { 

            listobj.attr("style","margin-left: " + ((Math.log(days) + 1) * 40 - 30) + "px");

        console.log(task.name + " has days: " + days);
        } 
        listobj.append(doneobj);
        listobj.append(nameobj);
        listobj.append(daysobj);
        tasklist.append(listobj);

        doneobj.on('click', function() {
            console.log(taskobj);
            app.setDone(taskobj);
        }); 

    }


};
