import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material';
import { Subscription } from 'rxjs';

import { Party } from '../../../shared/interfaces/party.interface';
import { PartyService } from '../../../shared/providers/party.service';
import { LadderTableComponent } from '../../components/ladder-table/ladder-table.component';
import { StateService } from '../../../shared/providers/state.service';
import { PlayerLadder } from '../../../shared/interfaces/player.interface';

@Component({
  selector: 'app-ladder-summary',
  templateUrl: './ladder-summary.component.html',
  styleUrls: ['./ladder-summary.component.scss']
})
export class LadderSummaryComponent implements OnInit, OnDestroy {
  form: FormGroup;
  filteredArr = [];
  private party: Party;
  private selectedFilterValueSub: Subscription;
  private partySub: Subscription;
  private stateSub: Subscription;
  private playerLadders: Array<PlayerLadder> = [];

  public selectedLocalValue: string;

  @ViewChild('playerDd') playerDd: MatSelect;
  @ViewChild('table') table: LadderTableComponent;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    public partyService: PartyService,
    private stateService: StateService
  ) {
    this.form = fb.group({
      searchText: ['']
    });
  }
  ngOnInit() {
    this.stateSub = this.stateService.state$.subscribe(state => {
      this.playerLadders = 'playerLadders'.split('.').reduce((o, i) => o[i], state);
    });
    // TODO: remove once ladder has been reworked
    if (this.partyService.selectedFilterValue !== 'All players') {
      this.selectedLocalValue = this.partyService.selectedFilterValue;
    } else {
      this.selectedLocalValue = this.getPlayers()[0].character.name;
    }

    this.selectedFilterValueSub = this.partyService.selectedFilterValueSub.subscribe(res => {
      if (res !== undefined) {
        this.partyService.selectedFilterValue = res;

        // TODO: remove once ladder has been reworked
        if (res !== 'All players') {
          this.selectedLocalValue = res;
        } else {
          this.selectedLocalValue = this.getPlayers()[0].character.name;
        }

        // update the tables whenever the value changes

        if (this.playerDd !== undefined) {
          this.playerDd.value = this.selectedLocalValue;
        }
        this.updateFilterValue(this.playerDd.value);
      }
    });
    this.partySub = this.partyService.partyUpdated.subscribe(res => {
      if (res !== undefined) {
        this.party = res;

        // check if the current dropdown selection is a player in our party
        const foundPlayer = this.party.players.find(x =>
          x.character !== null && x.character.name === this.selectedLocalValue);

        // if player left or value is incorrect, update dropdown
        if (foundPlayer === undefined) {
          // force-set the value here, since the subscription wont finish in time, should be reworked
          this.selectedLocalValue = this.getPlayers()[0].character.name;

          if (this.playerDd !== undefined) {
            this.playerDd.value = this.selectedLocalValue;
          }
        }
      }
    });
  }
  getPlayers() {
    return this.partyService.party.players.filter(x => x.character !== null);
  }
  ngOnDestroy() {
    if (this.selectedFilterValueSub !== undefined) {
      this.selectedFilterValueSub.unsubscribe();
    }
    if (this.partySub !== undefined) {
      this.partySub.unsubscribe();
    }
    if (this.stateSub !== undefined) {
      this.stateSub.unsubscribe();
    }
  }

  search() {
    this.table.doSearch(this.form.controls.searchText.value);
  }

  selectPlayer(filterValue: any) {
    this.partyService.selectedFilterValueSub.next(filterValue.value);

    if (this.party !== undefined) {
      const foundPlayer = this.party.players.find(x => x.character !== null && x.character.name === this.partyService.selectedFilterValue);

      // update values for entire party, or a specific player, depending on selection
      if (this.partyService.selectedFilterValue === 'All players' || this.partyService.selectedFilterValue === undefined) {
        const ladder = this.playerLadders.find(x => this.partyService.currentPlayer.character !== null &&
          x.name === this.partyService.currentPlayer.character.league);
        if (ladder !== undefined) {
          this.table.dataSource = [];
          this.table.updateTable(ladder.players);
        }
      } else if (foundPlayer !== undefined) {
        const ladder = this.playerLadders.find(x => x.name === foundPlayer.character.league);
        if (ladder !== undefined) {
          this.table.dataSource = [];
          this.table.updateTable(ladder.players);
        }
      }
    }
  }

  ladderFiltered(event) {
  }

  updateFilterValue(filterValue) {
    if (this.party !== undefined) {
      const foundPlayer = this.party.players.find(x => x.character !== null && x.character.name === filterValue);

      if (this.table !== undefined) {
        this.table.dataSource = [];
      }

      if (foundPlayer !== undefined) {
        if (this.table !== undefined) {
          const ladder = this.playerLadders.find(x => x.name === foundPlayer.character.league);
          if (ladder !== undefined) {
            this.table.dataSource = [];
            this.table.updateTable(ladder.players);
          }
        }
      }
    }
  }
}
