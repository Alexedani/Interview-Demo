const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseUrl = 'https://www.vlr.gg/team/10580/boise-state-university';
const statsUrl = baseUrl.replace('/team', '/team/stats');
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwpkcgmRVn-ccZzqMP86qUcoQUbgtObbJ85jkUMv5cl61U7VZSfQIS_IsHALEdiYEA/exec';

async function fetchOverviewData() {
    try {
        const response = await axios.get(baseUrl); 
        const html = response.data;
        const $ = cheerio.load(html);

        const teamName = $('.wf-title').first().text().trim();
        const players = [];

        $('.team-roster-item').each((index, element) => {
            const playerName = $(element).find('.team-roster-item-name-alias').text().trim();
            players.push(playerName);
        });

        return {
            name: teamName,
            players: players
        };

    } catch (error) {
        console.error('Error fetching team data:', error);
        return null;
    }
}

async function fetchMapStats() {
    try {
        const response = await axios.get(statsUrl);
        const html = response.data;
        const $ = cheerio.load(html);

        const mapStats = [];

        $('table.wf-table.mod-team-maps tbody tr').each((i, row) => {
            const cols = $(row).find('td');

            const mapName = $(cols[0]).text().trim();
            const winRate = $(cols[2]).text().trim();
            const wins = $(cols[3]).text().trim();
            const losses = $(cols[4]).text().trim();

            //skip empty rows
            if (!mapName || !winRate || !wins || !losses){
                return;
            }

            const mapStat = {
                map: mapName,
                winRate: winRate,
                wins: wins,
                losses: losses
            };

            mapStats.push(mapStat);
        });

        return mapStats;

    } catch (error) {
        console.error('Error fetching map stats:', error);
        return [];
    }
}

async function sendToGoogleAppsScript(data) {
  try {
    const resp = await axios.post(WEBAPP_URL, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('response:', resp.data);
    if (resp.data.status === 'error') {
      console.error('Server‑side error message:', resp.data.message);
    }
  } catch (err) {
    // test
    console.error('fail', 
      err.response?.data || err.message);
  }
}


async function saveDataToFile() {

    const overviewData = await fetchOverviewData();
    const statsData = await fetchMapStats();


    const finalData = {
        ...overviewData,
        mapStats: statsData
    };

    fs.writeFileSync('teamData.json', JSON.stringify(finalData, null, 2));
    console.log('data saved to teamData.json');

    await sendToGoogleAppsScript(finalData);
}

saveDataToFile();
