/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var _ = require('lodash');
var local = require('./localKill')();
var remote = require('./remoteKill')();



/**
 * the chaos monkey randomly connects to the nominated systems and kills random containers
 * at the specificed interval
 */
module.exports = function() {

  var randomInt = function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };



  var generateTargetList = function(system, systemDef) {
    var systems = [];

    _.each(system.topology.containers, function(c) {
      if (c.type === 'aws-instance') {
        systems.push({id: c.id, ip: c.specific.publicIpAddress, contains: c.contains});
      }
    });

    if (systems.length === 0) {
      systems.push({id: 'local', ip: '192.168.59.103', contains: []});
      _.each(system.topology.containers, function(c) {

        // select only docker containers that were built by nscale 
        // - name conainers are downloaded from docker central
        if (c.specific && c.specific.dockerImageId) {
          if (systemDef.topology.containers[c.id] && systemDef.topology.containers[c.id].specific) {
            if (!systemDef.topology.containers[c.id].specific.name) {
              systems[0].contains.push(c.specific.dockerContainerId);
            }
          }
        }
      });
    }
    return systems;
  };



  /**
   * kill a random container on a random machine...
   */
  var eeeekEeeek = function(system, systemDef, out, logger, cb) {
    var targets = generateTargetList(system, systemDef);

    if (targets.length >= 1) {
      var target = targets[randomInt(0, targets.length - 1)];
      if (target.contains.length > 0) {
        var targetContainer = target.contains[randomInt(0, target.contains.length - 1)];

        if (target.id === 'local') { 
          logger.info('eeek oook skreeeeeee local kill: ' + targetContainer);
          local.kill(targetContainer, out, cb);
        }
        else {
          logger.info('eeek oook skreeeeeee remote kill: ' + targetContainer);
          remote.kill(targetContainer, out, cb);
        }
      }
      else {
        logger.info('ook ook nothing to kill, can I please have a bananna now?');
        cb();
      }
    }
    else {
      logger.info('ook ook nothing to kill, can I please have a bananna now?');
      cb();
    }
  };



  return {
    eeeekEeeek: eeeekEeeek,
  };
};
 
